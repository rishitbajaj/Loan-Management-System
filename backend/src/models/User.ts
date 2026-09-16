import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import { BRE_STATUSES, EMPLOYMENT_MODES, ROLES, type BreStatus, type EmploymentMode, type Role } from '../types';

export interface ISalarySlip {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IBorrowerProfile {
  fullName?: string;
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  breStatus: BreStatus;
  breFailures: string[];
  salarySlip?: ISalarySlip;
}

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  profile?: IBorrowerProfile;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;
export type UserId = Types.ObjectId;

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    path: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const borrowerProfileSchema = new Schema<IBorrowerProfile>(
  {
    fullName: { type: String, trim: true },
    pan: { type: String, trim: true, uppercase: true },
    dob: { type: Date },
    monthlySalary: { type: Number, min: 0 },
    employmentMode: { type: String, enum: EMPLOYMENT_MODES },
    breStatus: { type: String, enum: BRE_STATUSES, default: 'pending', required: true },
    breFailures: { type: [String], default: [] },
    salarySlip: { type: salarySlipSchema },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'borrower', index: true },
    profile: { type: borrowerProfileSchema },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        const profile = ret.profile as { salarySlip?: Record<string, unknown> } | undefined;
        if (profile?.salarySlip) {
          delete profile.salarySlip.path;
        }
        return ret;
      },
    },
  },
);

export const User = model<IUser>('User', userSchema);
