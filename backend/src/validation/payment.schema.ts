import { z } from 'zod';

export const paymentSchema = z.object({
  utr: z
    .string({ error: 'UTR number is required' })
    .trim()
    .toUpperCase()
    .min(6, 'UTR must be at least 6 characters')
    .max(40, 'UTR must be at most 40 characters')
    .regex(/^[A-Z0-9]+$/, 'UTR may contain only letters and digits'),
  amount: z.coerce.number({ error: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  paidOn: z.coerce.date({ error: 'Payment date is required' }).refine((d) => d.getTime() <= Date.now(), {
    message: 'Payment date cannot be in the future',
  }),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
