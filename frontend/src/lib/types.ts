export const ROLES = ['admin', 'sales', 'sanction', 'disbursement', 'collection', 'borrower'] as const;
export type Role = (typeof ROLES)[number];

export const LOAN_STATUSES = ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const EMPLOYMENT_MODES = ['salaried', 'self-employed', 'unemployed'] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export type BreStatus = 'pending' | 'passed' | 'failed';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface SalarySlipMeta {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface BorrowerProfile {
  fullName?: string;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  breStatus: BreStatus;
  breFailures: string[];
  salarySlip?: SalarySlipMeta;
}

export interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: Role;
  profile?: BorrowerProfile;
  createdAt: string;
}

export interface BorrowerSummary {
  _id: string;
  name: string;
  email: string;
  profile?: Pick<
    BorrowerProfile,
    'fullName' | 'pan' | 'dob' | 'monthlySalary' | 'employmentMode' | 'breStatus' | 'breFailures' | 'salarySlip'
  >;
}

export interface StatusHistoryEntry {
  from: LoanStatus | null;
  to: LoanStatus;
  by: string;
  at: string;
  note?: string;
}

export interface Loan {
  _id: string;
  borrower: string | BorrowerSummary;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  totalPaid: number;
  outstanding: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  utr: string;
  amount: number;
  paidOn: string;
  recordedBy: string | { _id: string; name: string; email: string; role: Role };
  createdAt: string;
}

export interface SalesLead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  profile?: Pick<BorrowerProfile, 'fullName' | 'pan' | 'monthlySalary' | 'employmentMode' | 'breStatus' | 'breFailures'>;
  hasSalarySlip: boolean;
}

export interface DashboardSummary {
  loansByStatus: Record<LoanStatus, number>;
  totalLoans: number;
  totalBorrowers: number;
  leads: number;
  disbursedPrincipal: number;
  outstanding: number;
}

export interface BreResult {
  passed: boolean;
  failures: string[];
}

export interface LoanCalculation {
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
}

export function borrowerOf(loan: Loan): BorrowerSummary | null {
  return typeof loan.borrower === 'object' ? loan.borrower : null;
}
