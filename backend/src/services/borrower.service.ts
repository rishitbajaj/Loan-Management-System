import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { User, type ISalarySlip, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { buildSalarySlipPdf } from '../utils/salarySlipPdf';
import type { ProfileInput } from '../validation/borrower.schema';
import { runBre, type BreResult } from './bre.service';

async function getBorrower(userId: string, known?: UserDocument): Promise<UserDocument> {
  if (known && String(known._id) === userId) {
    if (known.role !== 'borrower') throw AppError.notFound('Borrower not found');
    return known;
  }
  const user = await User.findById(userId);
  if (!user || user.role !== 'borrower') throw AppError.notFound('Borrower not found');
  return user;
}

export async function updateProfile(
  userId: string,
  input: ProfileInput,
  known?: UserDocument,
): Promise<{ user: UserDocument; bre: BreResult }> {
  const user = await getBorrower(userId, known);
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

export async function saveSalarySlip(userId: string, file: Express.Multer.File, known?: UserDocument): Promise<UserDocument> {
  const user = await getBorrower(userId, known);
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

function slipPayload(slip: ISalarySlip, filePath = slip.path): ISalarySlip {
  return {
    path: filePath,
    originalName: slip.originalName,
    mimeType: slip.mimeType,
    size: slip.size,
    uploadedAt: slip.uploadedAt,
  };
}

async function fileSize(filePath: string): Promise<number | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() ? stats.size : null;
  } catch {
    return null;
  }
}

function storedBasename(storedPath: string): string {
  return path.win32.basename(storedPath) || path.posix.basename(storedPath);
}

async function resolveSalarySlipPath(storedPath: string): Promise<string | null> {
  const candidates = [storedPath, path.join(env.salarySlipDir, storedBasename(storedPath))];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    if ((await fileSize(candidate)) != null) return candidate;
  }
  return null;
}

function isSeedSlip(storedPath: string): boolean {
  return storedBasename(storedPath).startsWith('seed-');
}

async function materializeSeedPdf(user: UserDocument, slip: ISalarySlip): Promise<ISalarySlip> {
  const pdf = buildSalarySlipPdf({
    employeeName: user.profile?.fullName ?? user.name,
    pan: user.profile?.pan,
    employmentMode: user.profile?.employmentMode,
    monthlySalary: user.profile?.monthlySalary,
  });
  const dest = path.join(env.salarySlipDir, `seed-${String(user._id)}-salary-slip.pdf`);
  await fs.mkdir(env.salarySlipDir, { recursive: true });
  await fs.writeFile(dest, pdf);

  slip.path = dest;
  slip.mimeType = 'application/pdf';
  slip.size = pdf.length;
  user.markModified('profile');
  await user.save();

  return slipPayload(slip, dest);
}

export async function getSalarySlip(userId: string, known?: UserDocument): Promise<ISalarySlip> {
  const user = await getBorrower(userId, known);
  const slip = user.profile?.salarySlip;
  if (!slip) throw AppError.notFound('No salary slip uploaded yet');

  const resolved = await resolveSalarySlipPath(slip.path);
  const size = resolved ? await fileSize(resolved) : null;
  const unreadablePdf = slip.mimeType === 'application/pdf' && (size == null || size < 400);

  if (unreadablePdf && isSeedSlip(slip.path)) {
    return materializeSeedPdf(user, slip);
  }
  if (!resolved || size == null) {
    throw AppError.notFound('Salary slip file is missing; please upload it again');
  }

  return slipPayload(slip, resolved);
}
