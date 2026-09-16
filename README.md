# Loan Management System

This is a small lending app I built for the full-stack assignment. A borrower signs up, fills personal details, uploads a salary slip, and applies for a loan. After that, internal teams take over: sales looks at people who have not applied yet, sanction approves or rejects, disbursement releases the money, and collection records repayments until the loan closes.

Admin can open every module. Everyone else only sees their own.

## Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Auth: JWT and bcrypt

The UI lives in `frontend/`. The API lives in `backend/`.

## What you need

- Node.js 24 or newer
- MongoDB running locally, or a MongoDB Atlas cluster

## Setup

```bash
cd backend && npm install
cd ../frontend && npm install
```

Copy the env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

In `backend/.env`, set `MONGODB_URI` and a long `JWT_SECRET` (at least 16 characters). The example file is already pointed at local Mongo on port 27017. If you are using Atlas, swap in the `mongodb+srv://...` URI and allow your IP.

`frontend/.env.local` only needs:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`CLIENT_URL` on the backend should match wherever Next is running, usually `http://localhost:3000`.

Create the demo accounts:

```bash
cd backend
npm run seed
```

You can run seed more than once. It upserts by email, so it will not duplicate users. Every seeded account uses the same password: `Password@123`

| Role | Email |
| --- | --- |
| Admin | admin@lms.com |
| Sales | sales@lms.com |
| Sanction | sanction@lms.com |
| Disbursement | disbursement@lms.com |
| Collection | collection@lms.com |
| Borrower | borrower@lms.com |

There are extra seeded borrowers as well (`borrower-applied@lms.com`, `borrower-sanctioned@lms.com`, and so on) so the queues are not empty on first login.

Start both servers:

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

API health check: http://localhost:5000/api/health

App: http://localhost:3000

## How a loan moves

I used these statuses: `applied`, `sanctioned`, `rejected`, `disbursed`, `closed`.

The assignment text says "pending" once. The diagram on the same PDF uses APPLIED, so that is the name I went with. An applied loan is the one waiting for sanction.

```
borrower applies
        |
     applied
    /        \
sanctioned    rejected   (sanction or admin; reject needs a reason)
    |
disbursed                (disbursement or admin)
    |
  closed                 (automatic when outstanding hits 0)
```

Rejected and closed are the end. You cannot jump statuses from the client. The API has separate routes for sanction, reject, and disburse, and each one is role-checked on the server.

A borrower can only have one active loan (`applied`, `sanctioned`, or `disbursed`). After reject or close they can apply again.

## Borrower flow

1. Register or log in.
2. Personal details: full name, PAN, date of birth, monthly salary, employment type.
3. Eligibility is checked on the server (BRE). If anything fails, the form shows every failure, not just the first one.
4. Upload a salary slip (PDF, JPG or PNG, max 5 MB).
5. Pick amount (Rs 50,000 to Rs 5,00,000) and tenure (30 to 365 days) with sliders. Interest is 12% p.a. The panel on the right updates as you drag.
6. Apply. The loan is created as `applied`.

Simple interest:

```
SI = (P * R * T) / (365 * 100)
```

`T` is tenure in days. Total repayment is principal plus interest. The frontend shows this live, but the backend recalculates it when you apply. Whatever interest the client sends is ignored.

## BRE

This runs in `backend/src/services/bre.service.ts` on `PUT /api/borrower/profile`.

| Rule | Fails when |
| --- | --- |
| Age | not between 23 and 50 |
| Salary | below Rs 25,000 a month |
| PAN | not in the form AAAAA9999A |
| Employment | unemployed |

The UI repeats these checks so the borrower gets instant feedback, but only the server result is saved. A borrower who failed BRE cannot apply.

## Roles

Hiding a menu item is not the real check. Every protected API route also checks the JWT and the role.

| Role | Can do |
| --- | --- |
| Borrower | Application portal only. Cannot open the dashboard. |
| Sales | Leads: registered borrowers who have never applied. |
| Sanction | Applied loans. Approve, or reject with a reason. Can open the application and view the salary slip. |
| Disbursement | Sanctioned loans. Mark as disbursed. |
| Collection | Disbursed loans. Record payments. Closed loans show up as history. |
| Admin | Everything above, plus a summary page. |

Unauthorized API calls get `401` if there is no valid token, and `403` if the role is wrong.

## Payments

Collection can record a payment only on a disbursed loan. Each payment needs:

- UTR (unique across the whole system)
- Amount (greater than 0, not more than outstanding)
- Date (required, not in the future)

When `totalPaid` reaches `totalRepayment`, outstanding becomes 0 and the loan closes on its own.

If you reuse a UTR you get `409`. If you overpay you get `422`.

## Salary slips

Files are stored on disk under `backend/uploads/salary-slips/`, not as public URLs. The JSON never includes the filesystem path. Download goes through authenticated routes:

- borrower: `GET /api/borrower/salary-slip`
- staff reviewing a loan: `GET /api/loans/:id/salary-slip`

`backend/uploads/` is gitignored.

## API notes

Public routes: register, login, loan calculate, health.

Everything else needs `Authorization: Bearer <token>`.

Responses look like:

```json
{ "success": true, "data": {} }
```

or

```json
{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/register` | public (always creates a borrower) |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | logged in |
| PUT | `/api/borrower/profile` | borrower |
| POST | `/api/borrower/salary-slip` | borrower |
| GET | `/api/borrower/salary-slip` | borrower |
| GET | `/api/loans/calculate` | public |
| POST | `/api/loans` | borrower |
| GET | `/api/loans/me` | borrower |
| GET | `/api/loans/:id` | owner, or ops roles |
| GET | `/api/loans/:id/salary-slip` | owner, or ops roles |
| PATCH | `/api/loans/:id/sanction` | sanction, admin |
| PATCH | `/api/loans/:id/reject` | sanction, admin |
| PATCH | `/api/loans/:id/disburse` | disbursement, admin |
| GET | `/api/loans/:id/payments` | same as get loan |
| POST | `/api/loans/:id/payments` | collection, admin |
| GET | `/api/dashboard/sales/leads` | sales, admin |
| GET | `/api/dashboard/sanction/loans` | sanction, admin |
| GET | `/api/dashboard/disbursement/loans` | disbursement, admin |
| GET | `/api/dashboard/collection/loans` | collection, admin |
| GET | `/api/dashboard/summary` | admin |

A few choices I made while building this:

- BRE and loan math live on the server so the UI cannot be trusted.
- Loans and payments are separate collections because a loan can have many payments and UTR has to be unique globally.
- Outstanding is stored on the loan so collection does not have to sum payments on every page load.
- Status changes go through one `transition()` helper. Controllers do not set `status` by hand.

## Walkthrough

If you want to click through the whole lifecycle:

1. Register a new borrower (or use `borrower-e2e@lms.com` after a fresh seed).
2. Submit personal details that fail BRE (young age, salary 10000, bad PAN, unemployed) and check that all errors show up.
3. Fix the details so BRE passes.
4. Upload a small PDF or image.
5. Move the sliders, confirm the interest panel, apply. Status should be applied.
6. Log in as `sanction@lms.com`, open the application, look at the salary slip, approve.
7. Log in as `disbursement@lms.com` and mark it disbursed.
8. Log in as `collection@lms.com`. Record a partial payment, then the remaining amount. The loan should close.
9. Try the same UTR again (should fail) and an amount larger than outstanding (should fail).
10. As a borrower, `/dashboard` should send you back to `/apply`. As sales, you should not be able to open sanction.

## Things I did not build

Salary slips sit on the API server disk, so this is not set up for multiple machines. Dashboard lists are not paginated. The JWT is kept in `localStorage`. There is no email, SMS, payment gateway, or refresh-token flow. Fine for the assignment, not something I would ship as-is.

`.env` files, `node_modules`, `frontend/.next`, `backend/dist`, `backend/uploads`, and local Mongo data are gitignored. Only the `.env.example` files are committed.

## Deploy (Render + Vercel)

The API goes on Render. The Next.js app goes on Vercel. MongoDB has to be Atlas (or any Mongo that Render can reach). Local Mongo on your laptop will not work from Render.

### 1. MongoDB Atlas

Use an Atlas cluster. In Network Access, allow `0.0.0.0/0` so Render can connect. Copy the connection string.

### 2. Render (backend)

1. Go to https://dashboard.render.com and create a new Web Service from this GitHub repo.
2. Root directory: `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Health check path: `/api/health`

Environment variables:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI |
| `JWT_SECRET` | a long random string |
| `CLIENT_URL` | your Vercel URL, for example `https://something.vercel.app` |
| `JWT_EXPIRES_IN` | `1d` |
| `UPLOAD_DIR` | `uploads` |

Render sets `PORT` for you. Do not hardcode it.

After the first successful deploy, open the Render shell and seed the demo accounts:

```bash
node dist/scripts/seed.js
```

The public API URL will look like `https://lms-api.onrender.com`. Health check: `https://lms-api.onrender.com/api/health`

Note: salary slips are stored on disk. On the free Render plan that disk is wiped when the instance restarts, so uploaded files can disappear after sleep or redeploy. Seed data can be recreated by running seed again.

### 3. Vercel (frontend)

1. Go to https://vercel.com/new and import this GitHub repo.
2. Root directory: `frontend`
3. Framework: Next.js (it should detect this)

Environment variable:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

Deploy. Copy the Vercel URL, put it in Render as `CLIENT_URL`, and redeploy the API if you had a placeholder there.

If you add a custom domain later, add that origin to `CLIENT_URL` as well. You can pass more than one, comma separated:

```
CLIENT_URL=https://your-app.vercel.app,https://www.your-domain.com
```

Preview URLs on `*.vercel.app` are already allowed by the API.

### Order that actually works

1. Create the Render service with `CLIENT_URL=http://localhost:3000` for a minute, just so it boots.
2. Create the Vercel project pointing at the Render API URL.
3. Update Render `CLIENT_URL` to the Vercel origin and save (that restarts the API).
4. Seed from the Render shell.

Free Render services sleep after idle time. The first request after that can take 30 to 60 seconds.
