import type { Request, Response } from 'express';
import { requireUser } from '../middleware/auth';
import * as borrowerService from '../services/borrower.service';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';
import { profileSchema } from '../validation/borrower.schema';

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const input = profileSchema.parse(req.body);
  const { user, bre } = await borrowerService.updateProfile(id, input);
  sendSuccess(res, { user, bre }, bre.passed ? 'Eligibility check passed' : 'Eligibility check failed');
}

export async function uploadSalarySlip(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  if (!req.file) throw AppError.validation('Salary slip file is required', [{ field: 'file', message: 'Attach a PDF, JPG or PNG' }]);
  const user = await borrowerService.saveSalarySlip(id, req.file);
  sendSuccess(res, { user }, 'Salary slip uploaded');
}

export async function downloadSalarySlip(req: Request, res: Response): Promise<void> {
  const { id } = requireUser(req);
  const slip = await borrowerService.getSalarySlip(id);
  res.setHeader('Content-Type', slip.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(slip.originalName)}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(slip.path);
}
