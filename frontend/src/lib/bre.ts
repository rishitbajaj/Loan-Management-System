import type { EmploymentMode } from './types';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_MONTHLY_SALARY = 25_000;

export function calculateAge(dob: Date, today = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function getAgeValidationError(dob: string): string | undefined {
  if (!dob) return undefined;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return 'Enter a valid date of birth';
  const age = calculateAge(parsed);
  if (age < MIN_AGE || age > MAX_AGE) {
    return `Age must be between ${MIN_AGE} and ${MAX_AGE} (you are ${age})`;
  }
  return undefined;
}

// UX-only mirror of the server BRE; the server result is authoritative.
export function previewBre(input: { pan: string; dob: string; monthlySalary: number; employmentMode: EmploymentMode | '' }): string[] {
  const hints: string[] = [];
  const ageError = getAgeValidationError(input.dob);
  if (ageError) hints.push(ageError);
  if (input.monthlySalary > 0 && input.monthlySalary < MIN_MONTHLY_SALARY) hints.push('Monthly salary must be at least Rs 25,000');
  if (input.pan && !PAN_REGEX.test(input.pan.toUpperCase())) hints.push('PAN must look like AAAAA9999A');
  if (input.employmentMode === 'unemployed') hints.push('Applicant must be salaried or self-employed');
  return hints;
}
