import { z } from 'zod';
import { EMPLOYMENT_MODES } from '../types';

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  pan: z.string().trim().toUpperCase().min(1, 'PAN is required'),
  dob: z.coerce.date({ error: 'Enter a valid date of birth' }).refine((d) => d.getTime() < Date.now(), {
    message: 'Date of birth must be in the past',
  }),
  monthlySalary: z.coerce.number({ error: 'Monthly salary must be a number' }).positive('Monthly salary must be positive'),
  employmentMode: z.enum(EMPLOYMENT_MODES, { error: 'Select a valid employment mode' }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
