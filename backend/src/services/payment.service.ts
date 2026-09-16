import { Types } from 'mongoose';
import { Loan, type LoanDocument } from '../models/Loan';
import { Payment, type PaymentDocument } from '../models/Payment';
import type { AuthUser } from '../types';
import { AppError } from '../utils/AppError';
import { roundTo2 } from '../utils/loanMath';
import type { PaymentInput } from '../validation/payment.schema';
import { BORROWER_FIELDS, transition } from './loan.service';

export interface RecordPaymentResult {
  payment: PaymentDocument;
  loan: LoanDocument;
}

export async function recordPayment(loanId: string, actor: AuthUser, input: PaymentInput): Promise<RecordPaymentResult> {
  const loan = await Loan.findById(loanId);
  if (!loan) throw AppError.notFound('Loan not found');

  if (loan.status !== 'disbursed') {
    throw AppError.conflict(`Payments can only be recorded for disbursed loans (current status: ${loan.status})`);
  }

  const amount = roundTo2(input.amount);
  const outstanding = roundTo2(loan.totalRepayment - loan.totalPaid);

  if (amount > outstanding) {
    throw AppError.validation('Payment exceeds the outstanding balance', [
      { field: 'amount', message: `Amount cannot exceed outstanding balance of ${outstanding.toFixed(2)}` },
    ]);
  }

  if (await Payment.exists({ utr: input.utr })) {
    throw AppError.conflict('A payment with this UTR number already exists');
  }

  const payment = await Payment.create({
    loan: loan._id,
    utr: input.utr,
    amount,
    paidOn: input.paidOn,
    recordedBy: new Types.ObjectId(actor.id),
  });

  loan.totalPaid = roundTo2(loan.totalPaid + amount);
  loan.outstanding = roundTo2(loan.totalRepayment - loan.totalPaid);

  if (loan.outstanding === 0) {
    transition(loan, 'closed', actor, 'Loan fully repaid');
  }

  await loan.save();
  await loan.populate('borrower', BORROWER_FIELDS);

  return { payment, loan };
}

export async function listPayments(loanId: string): Promise<PaymentDocument[]> {
  return Payment.find({ loan: loanId }).populate('recordedBy', 'name email role').sort({ paidOn: -1, createdAt: -1 });
}
