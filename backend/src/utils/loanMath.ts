export const INTEREST_RATE_PA = 12;
export const MIN_PRINCIPAL = 50_000;
export const MAX_PRINCIPAL = 500_000;
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;

export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface LoanCalculation {
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
}

// SI = (P x R x T) / (365 x 100), T in days
export function calculateSimpleInterest(principal: number, tenureDays: number, rate = INTEREST_RATE_PA): number {
  return roundTo2((principal * rate * tenureDays) / (365 * 100));
}

export function calculateLoan(principal: number, tenureDays: number): LoanCalculation {
  const interest = calculateSimpleInterest(principal, tenureDays);
  return {
    principal: roundTo2(principal),
    tenureDays,
    interestRate: INTEREST_RATE_PA,
    interest,
    totalRepayment: roundTo2(principal + interest),
  };
}
