import type { EmploymentMode } from './types';

export const EMPLOYMENT_LABELS: Record<EmploymentMode, string> = {
  salaried: 'Salaried',
  'self-employed': 'Self-employed',
  unemployed: 'Unemployed',
};

export function employmentLabel(mode?: EmploymentMode): string {
  return mode ? EMPLOYMENT_LABELS[mode] : 'Not provided';
}

export function incomeProofTitle(mode?: EmploymentMode): string {
  if (mode === 'unemployed') return 'Income proof';
  return 'Income proof';
}

export function incomeProofDescription(mode?: EmploymentMode): string {
  switch (mode) {
    case 'salaried':
      return 'Upload a recent salary slip or bank statement. PDF, JPG or PNG · Maximum 5 MB.';
    case 'self-employed':
      return 'Upload bank statement, ITR, or business income proof using the document upload below. PDF, JPG or PNG · Maximum 5 MB.';
    case 'unemployed':
      return 'Income proof is not required for unemployed applicants.';
    default:
      return 'Upload income proof to continue. PDF, JPG or PNG · Maximum 5 MB.';
  }
}

export function incomeProofUploadLabel(mode?: EmploymentMode): string {
  switch (mode) {
    case 'self-employed':
      return 'Upload income proof';
    default:
      return 'Upload income proof';
  }
}

export function requiresIncomeProof(mode?: EmploymentMode): boolean {
  return mode !== 'unemployed';
}
