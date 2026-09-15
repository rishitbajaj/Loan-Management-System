import type { EmploymentMode } from '../types';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_MONTHLY_SALARY = 25_000;

export interface BreInput {
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface BreResult {
  passed: boolean;
  failures: string[];
}

export function calculateAge(dob: Date, today = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function runBre(input: BreInput): BreResult {
  const failures: string[] = [];

  const age = calculateAge(input.dob);
  if (age < MIN_AGE || age > MAX_AGE) {
    failures.push(`Age must be between ${MIN_AGE} and ${MAX_AGE} (you are ${age})`);
  }

  if (input.monthlySalary < MIN_MONTHLY_SALARY) {
    failures.push(`Monthly salary must be at least Rs ${MIN_MONTHLY_SALARY.toLocaleString('en-IN')}`);
  }

  if (!PAN_REGEX.test(input.pan)) {
    failures.push('PAN must match the format AAAAA9999A (5 letters, 4 digits, 1 letter)');
  }

  if (input.employmentMode === 'unemployed') {
    failures.push('Applicant must be salaried or self-employed');
  }

  return { passed: failures.length === 0, failures };
}
