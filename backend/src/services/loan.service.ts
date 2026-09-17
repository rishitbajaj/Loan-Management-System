import { Types } from 'mongoose';
import { Loan, type LoanDocument } from '../models/Loan';
import { User, type ISalarySlip, type UserDocument } from '../models/User';
import { ACTIVE_LOAN_STATUSES, type AuthUser, type LoanStatus, type Role } from '../types';
import { AppError } from '../utils/AppError';
import { calculateLoan } from '../utils/loanMath';
import { wallTime } from '../utils/requestTiming';
import type { LoanTermsInput } from '../validation/loan.schema';
import * as borrowerService from './borrower.service';

export const BORROWER_FIELDS =
  'name email role profile.fullName profile.pan profile.dob profile.monthlySalary profile.employmentMode profile.breStatus profile.breFailures profile.salarySlip';

const LIST_BORROWER_FIELDS = 'name email profile.fullName';

const TRANSITIONS: Record<LoanStatus, Partial<Record<LoanStatus, Role[]>>> = {
  applied: { sanctioned: ['sanction', 'admin'], rejected: ['sanction', 'admin'] },
  sanctioned: { disbursed: ['disbursement', 'admin'] },
  disbursed: { closed: ['collection', 'admin'] },
  rejected: {},
  closed: {},
};

export function canTransition(from: LoanStatus, to: LoanStatus, role: Role): boolean {
  return TRANSITIONS[from][to]?.includes(role) ?? false;
}

export function transition(loan: LoanDocument, to: LoanStatus, actor: AuthUser, note?: string): LoanDocument {
  const from = loan.status;
  const allowedRoles = TRANSITIONS[from][to];

  if (!allowedRoles) {
    throw AppError.conflict(`Cannot move a loan from "${from}" to "${to}"`);
  }
  if (!allowedRoles.includes(actor.role)) {
    throw AppError.forbidden(`Role "${actor.role}" cannot move a loan from "${from}" to "${to}"`);
  }
  if (to === 'rejected' && !note) {
    throw AppError.validation('A rejection reason is required', [{ field: 'reason', message: 'Rejection reason is required' }]);
  }

  const actorId = new Types.ObjectId(actor.id);
  const now = new Date();

  switch (to) {
    case 'sanctioned':
      loan.sanctionedBy = actorId;
      loan.sanctionedAt = now;
      break;
    case 'rejected':
      loan.rejectionReason = note;
      break;
    case 'disbursed':
      loan.disbursedBy = actorId;
      loan.disbursedAt = now;
      break;
    case 'closed':
      loan.closedAt = now;
      break;
  }

  loan.status = to;
  loan.statusHistory.push({ from, to, by: actorId, at: now, note });
  return loan;
}

async function findLoanOrFail(loanId: string): Promise<LoanDocument> {
  const loan = await Loan.findById(loanId);
  if (!loan) throw AppError.notFound('Loan not found');
  return loan;
}

function borrowerIdOf(loan: LoanDocument): string {
  if (loan.populated('borrower')) {
    return String((loan.borrower as unknown as { _id: unknown })._id);
  }
  return String(loan.borrower);
}

export async function sanctionLoan(loanId: string, actor: AuthUser): Promise<LoanDocument> {
  const loan = await findLoanOrFail(loanId);
  transition(loan, 'sanctioned', actor, 'Loan approved');
  await loan.save();
  return loan.populate('borrower', BORROWER_FIELDS);
}

export async function rejectLoan(loanId: string, actor: AuthUser, reason: string): Promise<LoanDocument> {
  const loan = await findLoanOrFail(loanId);
  transition(loan, 'rejected', actor, reason);
  await loan.save();
  return loan.populate('borrower', BORROWER_FIELDS);
}

export async function disburseLoan(loanId: string, actor: AuthUser): Promise<LoanDocument> {
  const loan = await findLoanOrFail(loanId);
  transition(loan, 'disbursed', actor, 'Loan disbursed');
  await loan.save();
  return loan.populate('borrower', BORROWER_FIELDS);
}

export async function listLoansByStatus(statuses: LoanStatus[]): Promise<LoanDocument[]> {
  return wallTime(
    'listByStatus',
    Loan.find({ status: { $in: statuses } })
      .select('-statusHistory -__v')
      .populate('borrower', LIST_BORROWER_FIELDS)
      .sort({ updatedAt: -1 }),
  );
}

export async function createLoan(borrower: AuthUser, terms: LoanTermsInput, known?: UserDocument): Promise<LoanDocument> {
  const user = known && String(known._id) === borrower.id ? known : await User.findById(borrower.id);
  if (!user || user.role !== 'borrower') throw AppError.notFound('Borrower not found');

  if (user.profile?.breStatus !== 'passed') {
    throw AppError.conflict('Complete your personal details and pass the eligibility check before applying');
  }
  if (!user.profile.salarySlip) {
    throw AppError.conflict('Upload your salary slip before applying');
  }

  const active = await Loan.exists({ borrower: user._id, status: { $in: ACTIVE_LOAN_STATUSES } });
  if (active) throw AppError.conflict('Borrower already has an active loan');

  const calc = calculateLoan(terms.principal, terms.tenureDays);

  return Loan.create({
    borrower: user._id,
    ...calc,
    totalPaid: 0,
    outstanding: calc.totalRepayment,
    status: 'applied',
    statusHistory: [{ from: null, to: 'applied', by: user._id, at: new Date(), note: 'Loan application submitted' }],
  });
}

export async function assertCanAccessLoan(loanId: string, user: AuthUser): Promise<void> {
  const loan = await Loan.findById(loanId).select('borrower').lean();
  if (!loan) throw AppError.notFound('Loan not found');

  if (user.role === 'borrower' && String(loan.borrower) !== user.id) {
    throw AppError.forbidden('You can only view your own loans');
  }
  if (user.role === 'sales') {
    throw AppError.forbidden('Sales cannot access loan records');
  }
}

export async function listMyLoans(borrowerId: string): Promise<LoanDocument[]> {
  return Loan.find({ borrower: borrowerId }).select('-__v').sort({ createdAt: -1 });
}

export async function getLoanForUser(loanId: string, user: AuthUser): Promise<LoanDocument> {
  const loan = await Loan.findById(loanId).populate('borrower', BORROWER_FIELDS);
  if (!loan) throw AppError.notFound('Loan not found');

  if (user.role === 'borrower') {
    if (borrowerIdOf(loan) !== user.id) throw AppError.forbidden('You can only view your own loans');
  } else if (user.role === 'sales') {
    throw AppError.forbidden('Sales cannot access loan records');
  }
  return loan;
}

export async function getSalarySlipForLoan(loanId: string, user: AuthUser): Promise<ISalarySlip> {
  const loan = await getLoanForUser(loanId, user);
  const populated = loan.populated('borrower') ? (loan.borrower as unknown as UserDocument) : undefined;
  return borrowerService.getSalarySlip(borrowerIdOf(loan), populated);
}
