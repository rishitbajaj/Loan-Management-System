import type { LoanCalculation } from './types';

export const INTEREST_RATE_PA = 12;
export const MIN_PRINCIPAL = 50_000;
export const MAX_PRINCIPAL = 500_000;
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;

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
