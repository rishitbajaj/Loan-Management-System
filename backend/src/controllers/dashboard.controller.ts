import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import * as loanService from '../services/loan.service';
import { sendSuccess } from '../utils/apiResponse';

export async function salesLeads(_req: Request, res: Response): Promise<void> {
  const leads = await dashboardService.listSalesLeads();
  sendSuccess(res, { leads });
}

export async function sanctionQueue(_req: Request, res: Response): Promise<void> {
  const loans = await loanService.listLoansByStatus(['applied']);
  sendSuccess(res, { loans });
}

export async function disbursementQueue(_req: Request, res: Response): Promise<void> {
  const loans = await loanService.listLoansByStatus(['sanctioned']);
  sendSuccess(res, { loans });
}

export async function collectionQueue(req: Request, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const statuses = status === 'disbursed' ? (['disbursed'] as const) : (['disbursed', 'closed'] as const);
  const loans = await loanService.listLoansByStatus([...statuses]);
  sendSuccess(res, { loans });
}

export async function summary(_req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getSummary();
  sendSuccess(res, data);
}
