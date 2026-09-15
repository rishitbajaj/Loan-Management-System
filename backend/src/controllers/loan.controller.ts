import type { Request, Response } from 'express';
import { requireUser } from '../middleware/auth';
import * as loanService from '../services/loan.service';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { calculateLoan } from '../utils/loanMath';
import { loanIdSchema, loanTermsSchema, rejectSchema } from '../validation/loan.schema';

export function calculate(req: Request, res: Response): void {
  const terms = loanTermsSchema.parse(req.query);
  sendSuccess(res, calculateLoan(terms.principal, terms.tenureDays));
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const terms = loanTermsSchema.parse(req.body);
  const loan = await loanService.createLoan(user, terms);
  sendCreated(res, { loan }, 'Loan application submitted');
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const loans = await loanService.listMyLoans(user.id);
  sendSuccess(res, { loans });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = loanIdSchema.parse(req.params);
  const loan = await loanService.getLoanForUser(id, user);
  sendSuccess(res, { loan });
}

export async function sanction(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = loanIdSchema.parse(req.params);
  const loan = await loanService.sanctionLoan(id, user);
  sendSuccess(res, { loan }, 'Loan sanctioned');
}

export async function reject(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = loanIdSchema.parse(req.params);
  const { reason } = rejectSchema.parse(req.body);
  const loan = await loanService.rejectLoan(id, user, reason);
  sendSuccess(res, { loan }, 'Loan rejected');
}

export async function disburse(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = loanIdSchema.parse(req.params);
  const loan = await loanService.disburseLoan(id, user);
  sendSuccess(res, { loan }, 'Loan disbursed');
}
