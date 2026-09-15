import { z } from 'zod';
import { MAX_PRINCIPAL, MAX_TENURE_DAYS, MIN_PRINCIPAL, MIN_TENURE_DAYS } from '../utils/loanMath';

export const loanTermsSchema = z.object({
  principal: z.coerce
    .number({ error: 'Principal must be a number' })
    .min(MIN_PRINCIPAL, `Principal must be between ${MIN_PRINCIPAL} and ${MAX_PRINCIPAL}`)
    .max(MAX_PRINCIPAL, `Principal must be between ${MIN_PRINCIPAL} and ${MAX_PRINCIPAL}`),
  tenureDays: z.coerce
    .number({ error: 'Tenure must be a number' })
    .int('Tenure must be a whole number of days')
    .min(MIN_TENURE_DAYS, `Tenure must be between ${MIN_TENURE_DAYS} and ${MAX_TENURE_DAYS} days`)
    .max(MAX_TENURE_DAYS, `Tenure must be between ${MIN_TENURE_DAYS} and ${MAX_TENURE_DAYS} days`),
});

export const loanIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid loan id'),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters').max(500),
});

export type LoanTermsInput = z.infer<typeof loanTermsSchema>;
