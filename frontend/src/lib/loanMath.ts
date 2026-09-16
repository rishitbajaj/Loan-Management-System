import type { LoanCalculation } from './types';

export const INTEREST_RATE_PA = 12;
export const MIN_PRINCIPAL = 50_000;
export const MAX_PRINCIPAL = 500_000;
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;
export const COMPARE_TENURE_OPTIONS = [90, 180, 365] as const;

export interface LoanPlan extends LoanCalculation {
  startDate: string;
  endDate: string;
}

function parseCalendarDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

function toIsoDate(y: number, m: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function todayCalendarDate(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Add whole calendar days without UTC timezone drift. */
export function addCalendarDays(startIso: string, days: number): string {
  const { y, m, d } = parseCalendarDate(startIso);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function formatCalendarDateDisplay(iso: string): string {
  const { y, m, d } = parseCalendarDate(iso);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Mirrors backend/src/utils/loanMath.ts for instant UI feedback; the backend value is authoritative.
export function calculateLoan(principal: number, tenureDays: number): LoanCalculation {
  const interest = roundTo2((principal * INTEREST_RATE_PA * tenureDays) / (365 * 100));
  return {
    principal: roundTo2(principal),
    tenureDays,
    interestRate: INTEREST_RATE_PA,
    interest,
    totalRepayment: roundTo2(principal + interest),
  };
}

export function calculateLoanPlan(principal: number, tenureDays: number, startDate = todayCalendarDate()): LoanPlan {
  const calc = calculateLoan(principal, tenureDays);
  return {
    ...calc,
    startDate,
    endDate: addCalendarDays(startDate, tenureDays),
  };
}

export function compareLoanPlans(
  principal: number,
  tenures: readonly number[],
  startDate = todayCalendarDate(),
): LoanPlan[] {
  return tenures.map((tenureDays) => calculateLoanPlan(principal, tenureDays, startDate));
}

export function estimatedMonthlyRepayment(totalRepayment: number, tenureDays: number): number {
  const months = Math.max(tenureDays / 30, 1);
  return roundTo2(totalRepayment / months);
}

export function incomeToRepaymentRatio(monthlySalary: number, totalRepayment: number, tenureDays: number): number {
  if (monthlySalary <= 0) return 0;
  const monthly = estimatedMonthlyRepayment(totalRepayment, tenureDays);
  return roundTo2((monthly / monthlySalary) * 100);
}

/** True when a longer tenure increases total interest for the same principal (simple interest model). */
export function longerTenureIncreasesInterest(principal: number): boolean {
  const short = calculateLoan(principal, MIN_TENURE_DAYS);
  const long = calculateLoan(principal, MAX_TENURE_DAYS);
  return long.interest > short.interest;
}
