import fs from 'node:fs/promises';
import { User, type ISalarySlip, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import type { ProfileInput } from '../validation/borrower.schema';
import { runBre, type BreResult } from './bre.service';

async function getBorrower(userId: string): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user || user.role !== 'borrower') throw AppError.notFound('Borrower not found');
  return user;
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<{ user: UserDocument; bre: BreResult }> {
  const user = await getBorrower(userId);
  const bre = runBre(input);

  user.profile = {
    ...(user.profile ?? { breStatus: 'pending', breFailures: [] }),
    fullName: input.fullName,
    pan: input.pan,
    dob: input.dob,
    monthlySalary: input.monthlySalary,
    employmentMode: input.employmentMode,
    breStatus: bre.passed ? 'passed' : 'failed',
    breFailures: bre.failures,
  };
  await user.save();

  return { user, bre };
}

export async function saveSalarySlip(userId: string, file: Express.Multer.File): Promise<UserDocument> {
  const user = await getBorrower(userId);
  const previous = user.profile?.salarySlip?.path;

  const slip: ISalarySlip = {
    path: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };

  user.profile = { ...(user.profile ?? { breStatus: 'pending', breFailures: [] }), salarySlip: slip };
  await user.save();

  if (previous && previous !== file.path) {
    await fs.rm(previous, { force: true });
  }
  return user;
}

export async function getSalarySlip(userId: string): Promise<ISalarySlip> {
  const user = await getBorrower(userId);
  const slip = user.profile?.salarySlip;
  if (!slip) throw AppError.notFound('No salary slip uploaded yet');

  try {
    await fs.access(slip.path);
  } catch {
    throw AppError.notFound('Salary slip file is missing; please upload it again');
  }
  return slip;
}
