import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import { LOAN_STATUSES, type LoanStatus } from '../types';
import { INTEREST_RATE_PA, MAX_PRINCIPAL, MAX_TENURE_DAYS, MIN_PRINCIPAL, MIN_TENURE_DAYS } from '../utils/loanMath';

export interface IStatusHistoryEntry {
  from: LoanStatus | null;
  to: LoanStatus;
  by: Types.ObjectId;
  at: Date;
  note?: string;
}

export interface ILoan {
  borrower: Types.ObjectId;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  totalPaid: number;
  outstanding: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type LoanDocument = HydratedDocument<ILoan>;

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    from: { type: String, enum: [...LOAN_STATUSES, null], default: null },
    to: { type: String, enum: LOAN_STATUSES, required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, required: true, default: () => new Date() },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const loanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    principal: { type: Number, required: true, min: MIN_PRINCIPAL, max: MAX_PRINCIPAL },
    tenureDays: { type: Number, required: true, min: MIN_TENURE_DAYS, max: MAX_TENURE_DAYS },
    interestRate: { type: Number, required: true, default: INTEREST_RATE_PA },
    interest: { type: Number, required: true, min: 0 },
    totalRepayment: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, required: true, default: 0, min: 0 },
    outstanding: { type: Number, required: true, min: 0 },
    status: { type: String, enum: LOAN_STATUSES, required: true, default: 'applied', index: true },
    rejectionReason: { type: String, trim: true },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

loanSchema.index({ borrower: 1, status: 1 });
loanSchema.index({ status: 1, updatedAt: -1 });

export const Loan = model<ILoan>('Loan', loanSchema);
