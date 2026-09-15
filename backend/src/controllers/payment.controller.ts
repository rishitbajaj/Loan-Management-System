import type { Request, Response } from 'express';
import { requireUser } from '../middleware/auth';
import * as loanService from '../services/loan.service';
import * as paymentService from '../services/payment.service';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { loanIdSchema } from '../validation/loan.schema';
import { paymentSchema } from '../validation/payment.schema';

export async function record(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = loanIdSchema.parse(req.params);
  const input = paymentSchema.parse(req.body);
  const result = await paymentService.recordPayment(id, user, input);
  const message = result.loan.status === 'closed' ? 'Payment recorded; loan fully repaid and closed' : 'Payment recorded';
  sendCreated(res, result, message);
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = loanIdSchema.parse(req.params);
  await loanService.getLoanForUser(id, user);
  const payments = await paymentService.listPayments(id);
  sendSuccess(res, { payments });
}
