import { Loan, type LoanDocument } from '../models/Loan';
import { User } from '../models/User';
import { ACTIVE_LOAN_STATUSES, type AuthUser } from '../types';
import { AppError } from '../utils/AppError';
import { calculateLoan } from '../utils/loanMath';
import type { LoanTermsInput } from '../validation/loan.schema';

export const BORROWER_FIELDS = 'name email profile.fullName profile.pan profile.monthlySalary profile.employmentMode profile.breStatus';

export async function createLoan(borrower: AuthUser, terms: LoanTermsInput): Promise<LoanDocument> {
  const user = await User.findById(borrower.id);
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

export async function listMyLoans(borrowerId: string): Promise<LoanDocument[]> {
  return Loan.find({ borrower: borrowerId }).sort({ createdAt: -1 });
}

export async function getLoanForUser(loanId: string, user: AuthUser): Promise<LoanDocument> {
  const loan = await Loan.findById(loanId).populate('borrower', BORROWER_FIELDS);
  if (!loan) throw AppError.notFound('Loan not found');

  if (user.role === 'borrower') {
    const ownerId = loan.populated('borrower') ? String((loan.borrower as unknown as { _id: unknown })._id) : String(loan.borrower);
    if (ownerId !== user.id) throw AppError.forbidden('You can only view your own loans');
  }
  return loan;
}
