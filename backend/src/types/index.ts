export const ROLES = ['admin', 'sales', 'sanction', 'disbursement', 'collection', 'borrower'] as const;
export type Role = (typeof ROLES)[number];

export const EXECUTIVE_ROLES: Role[] = ['admin', 'sales', 'sanction', 'disbursement', 'collection'];

// "applied" is the assignment's pending application state; no separate "pending" status.
export const LOAN_STATUSES = ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const ACTIVE_LOAN_STATUSES: LoanStatus[] = ['applied', 'sanctioned', 'disbursed'];

export const EMPLOYMENT_MODES = ['salaried', 'self-employed', 'unemployed'] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export const BRE_STATUSES = ['pending', 'passed', 'failed'] as const;
export type BreStatus = (typeof BRE_STATUSES)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
