# Loan Management System

MERN-style lending platform: borrowers apply for a loan, internal executives move it through its lifecycle.

- Frontend: Next.js App Router, TypeScript, Tailwind CSS (`frontend/`)
- Backend: Node.js, Express, TypeScript, Mongoose (`backend/`)
- Database: MongoDB Atlas
- Auth: JWT + bcrypt

## Architecture

```
Borrower / Executive UI (Next.js)
        |
   UX route guard (src/proxy.ts + AuthProvider)
        |
   HTTP + Bearer JWT
        |
Express: helmet, CORS(CLIENT_URL)
        |
JWT auth middleware          -> 401 if missing/invalid
RBAC requireRole middleware  -> 403 if wrong role
Controller / service         -> 404 / 409 / 422 business rules
MongoDB (users, loans, payments)
```

Frontend route protection is navigation only. The backend independently verifies the JWT, loads the user, and derives the role. A client-supplied `role` is ignored. Register always creates a `borrower`.

## Prerequisites

- Node.js 24+ and npm 11+
- A MongoDB Atlas cluster (free tier is enough)
- Atlas Database Access user and Network Access IP allow-list (or `0.0.0.0/0` for local eval)

## Setup

### 1. Clone and install

```bash
cd Loan-Management-System
cd backend && npm install
cd ../frontend && npm install
```

### 2. MongoDB Atlas

1. Create a cluster and a database user.
2. Allow your IP (or `0.0.0.0/0` for evaluation).
3. Copy the connection string.

### 3. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

`backend/.env`

| Variable | Example | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | `production` hides stack traces |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster/lms?...` | Atlas URI |
| `JWT_SECRET` | long random string (16+ chars) | Signs JWTs |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin (not `*`) |
| `UPLOAD_DIR` | `uploads` | Disk folder for salary slips |

`frontend/.env.local`

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` |

### 4. Seed accounts

```bash
cd backend
npm run seed
```

Idempotent (upsert by email). Password for every seeded account: `Password@123`

| Role | Email |
| --- | --- |
| Admin | `admin@lms.com` |
| Sales | `sales@lms.com` |
| Sanction | `sanction@lms.com` |
| Disbursement | `disbursement@lms.com` |
| Collection | `collection@lms.com` |
| Borrower | `borrower@lms.com` |

### 5. Run

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

- API: http://localhost:5000/api/health
- UI: http://localhost:3000

## Loan status lifecycle

Statuses used everywhere: `applied`, `sanctioned`, `rejected`, `disbursed`, `closed`.

**`applied` represents the pending application state described in the assignment.** There is no separate `pending` status.

```
Borrower applies
    -> applied
         -> sanctioned   (sanction / admin)
         -> rejected     (sanction / admin, reason required)
    sanctioned
         -> disbursed    (disbursement / admin)
    disbursed
         -> closed       (automatic when outstanding hits 0)
```

`rejected` and `closed` are terminal. Transitions go through `loanService.transition()` only. Clients cannot PATCH `{ "status": "sanctioned" }`. Each transition appends `statusHistory` and sets audit fields (`sanctionedBy/At`, `disbursedBy/At`, `closedAt`, `rejectionReason`).

## RBAC

| Role | UI | APIs |
| --- | --- | --- |
| Borrower | `/apply/*` | profile, salary slip, create/list own loans |
| Sales | `/dashboard/sales` | sales leads |
| Sanction | `/dashboard/sanction` | applied loans, approve, reject |
| Disbursement | `/dashboard/disbursement` | sanctioned loans, disburse |
| Collection | `/dashboard/collection` | disbursed/closed loans, payments |
| Admin | all dashboard modules + overview | all of the above |

HTTP codes:

- `401` unauthenticated / bad JWT
- `403` authenticated but wrong role
- `404` missing resource
- `409` conflict (active loan, duplicate UTR, illegal transition)
- `422` validation (zod, overpayment, bad file)

## BRE (Business Rule Engine)

Implemented in `backend/src/services/bre.service.ts`. Runs on `PUT /api/borrower/profile`. Returns **all** failures, not the first one.

| Rule | Reject when |
| --- | --- |
| Age | not between 23 and 50 inclusive |
| Salary | below Rs 25,000 / month |
| PAN | does not match `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| Employment | `unemployed` |

The frontend mirrors these messages for instant hints. The server result is the only one that is stored.

## Loan calculation

`SI = (P × R × T) / (365 × 100)` with `R = 12`, `T` in days.

- Principal: 50,000 – 5,00,000
- Tenure: 30 – 365 days
- Money rounded to 2 decimal places (`roundTo2`)

Frontend (`frontend/src/lib/loanMath.ts`) updates the live panel. Backend (`backend/src/utils/loanMath.ts`) recalculates on apply. The client may send only `{ principal, tenureDays }`. `interest` / `totalRepayment` from the client are ignored.

## Payments

- Allowed only when status is `disbursed`
- `paidOn` is **required** and cannot be in the future (omit = 422)
- Amount > 0 and ≤ outstanding (else 422)
- UTR required, trimmed, uppercased, unique across all payments (Mongo unique index + 409)
- `totalPaid = roundTo2(prev + amount)`, `outstanding = roundTo2(totalRepayment - totalPaid)`
- If outstanding is 0, the loan transitions to `closed` and `closedAt` is set

## Salary slips

- `POST /api/borrower/salary-slip` multipart field `file`
- PDF / JPG / PNG, max 5 MB
- Stored under `backend/uploads/salary-slips/` with a generated filename (`<userId>-<uuid>.<ext>`)
- **Not** served as a static URL
- `GET /api/borrower/salary-slip` streams the file after JWT + borrower checks
- Filesystem `path` is never returned in JSON
- `backend/uploads/` is gitignored

## Active loan rule

A borrower may have only one loan in `applied | sanctioned | disbursed`. A second apply returns `409` with `"Borrower already has an active loan"`. After `rejected` or `closed` they may apply again. Enforced on the server.

## Sales leads

A lead is a **borrower who has never created a loan** (not "no active loan"). Implemented with `$lookup` on `loans` and `$match` empty array.

## API

All `/api/*` except register, login, calculate, and health require `Authorization: Bearer <jwt>`.

Success: `{ "success": true, "message?": "...", "data": {} }`  
Error: `{ "success": false, "message": "...", "errors?": [{ "field", "message" }] }`

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/register` | public (always borrower) |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any authenticated |
| PUT | `/api/borrower/profile` | borrower |
| POST | `/api/borrower/salary-slip` | borrower |
| GET | `/api/borrower/salary-slip` | borrower (file stream) |
| GET | `/api/loans/calculate?principal=&tenureDays=` | public |
| POST | `/api/loans` | borrower |
| GET | `/api/loans/me` | borrower |
| GET | `/api/loans/:id` | owner, or sanction/disbursement/collection/admin |
| PATCH | `/api/loans/:id/sanction` | sanction, admin |
| PATCH | `/api/loans/:id/reject` | sanction, admin |
| PATCH | `/api/loans/:id/disburse` | disbursement, admin |
| GET | `/api/loans/:id/payments` | as GET loan |
| POST | `/api/loans/:id/payments` | collection, admin |
| GET | `/api/dashboard/sales/leads` | sales, admin |
| GET | `/api/dashboard/sanction/loans` | sanction, admin |
| GET | `/api/dashboard/disbursement/loans` | disbursement, admin |
| GET | `/api/dashboard/collection/loans` | collection, admin |
| GET | `/api/dashboard/summary` | admin |

## Design decisions

1. **BRE on the server** so a modified client cannot skip eligibility.
2. **Frontend may mirror BRE** so the borrower sees likely failures before submit.
3. **Backend is authoritative** for auth, role, BRE, loan math, status, and payments.
4. **Salary slips behind auth** because they are personal documents; a public `/uploads/...` URL would leak them.
5. **loans and payments are separate collections** because payments are 1:N and UTR needs a global unique index.
6. **UTR unique index** so two concurrent posts cannot insert the same reference even if the app-level check races.
7. **Outstanding is stored** so collection and the borrower status page do not re-sum payments on every view, and auto-close is a simple `outstanding === 0`.
8. **`applied` is the assignment's pending state** so the dashboard language matches the PDF (APPLIED → SANCTIONED → DISBURSED → CLOSED).
9. **Transitions are centralized** in `loanService.transition()` with a role map. Controllers never set `status` directly.
10. **Frontend vs backend RBAC**: hiding a nav item is UX. The API still returns 401/403 if the request is forged.

## Local commands

```bash
cd backend && npm run typecheck && npm run seed && npm run dev
cd frontend && npm run build && npm run dev
```

## Demo flow (for the 3–5 min video)

1. Register a new borrower (or use `borrower@lms.com` after resetting their profile).
2. Personal details that fail BRE (age < 23, salary 10000, bad PAN, unemployed) — show all errors.
3. Correct details so BRE passes.
4. Upload a small PDF/JPG salary slip; show the authenticated preview.
5. Move sliders; show live SI panel; Apply; status = `applied`.
6. Log in as `sanction@lms.com` → Approve.
7. Log in as `disbursement@lms.com` → Mark disbursed.
8. Log in as `collection@lms.com` → record a partial payment, then a final payment; loan closes.
9. Try the same UTR again (409) and an overpayment (422).
10. Log in as the borrower; dashboard URL redirects to `/apply`. Log in as sales; sanction URL redirects away.

## Known limitations

- Salary slips live on the API server disk (not object storage). Fine for the assignment; not multi-instance.
- No pagination on dashboard lists (not required; queues stay small).
- JWT is stored in `localStorage` plus a non-httpOnly presence cookie for the Next.js proxy. Backend JWT verification is still the security boundary.
- No email/SMS, no payment gateway, no refresh-token rotation.

## Repo hygiene

- `.env` files are gitignored; commit `.env.example` only
- `node_modules/`, `frontend/.next/`, `backend/dist/`, `backend/uploads/` are gitignored
- No secrets in the repo
