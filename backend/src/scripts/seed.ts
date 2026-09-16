import fs from 'node:fs';
import path from 'node:path';
import { Types } from 'mongoose';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Loan, type IStatusHistoryEntry } from '../models/Loan';
import { Payment } from '../models/Payment';
import { User, type IBorrowerProfile, type ISalarySlip } from '../models/User';
import { hashPassword } from '../services/auth.service';
import type { EmploymentMode, LoanStatus, Role } from '../types';
import { calculateLoan, roundTo2 } from '../utils/loanMath';
import { buildSalarySlipPdf } from '../utils/salarySlipPdf';

export const SEED_PASSWORD = 'Password@123';

export const SEED_ACCOUNTS: { name: string; email: string; role: Role }[] = [
  { name: 'Admin User', email: 'admin@lms.com', role: 'admin' },
  { name: 'Sales Executive', email: 'sales@lms.com', role: 'sales' },
  { name: 'Sanction Executive', email: 'sanction@lms.com', role: 'sanction' },
  { name: 'Disbursement Executive', email: 'disbursement@lms.com', role: 'disbursement' },
  { name: 'Collection Executive', email: 'collection@lms.com', role: 'collection' },
  { name: 'Demo Borrower', email: 'borrower@lms.com', role: 'borrower' },
];

type LoanSeedKind = 'applied' | 'sanctioned' | 'rejected' | 'disbursed-partial' | 'closed';

interface BorrowerSeed {
  name: string;
  email: string;
  profile: IBorrowerProfile;
  loan?: LoanSeedKind;
  principal?: number;
  tenureDays?: number;
}

const PASSED_PROFILE = {
  fullName: 'Rajesh Kumar',
  pan: 'ABCDE1234F',
  dob: new Date('1994-06-15'),
  monthlySalary: 55_000,
  employmentMode: 'salaried' as EmploymentMode,
};

const SEED_BORROWERS: BorrowerSeed[] = [
  {
    name: 'Lead Pending',
    email: 'lead-pending@lms.com',
    profile: { breStatus: 'pending', breFailures: [] },
  },
  {
    name: 'Lead BRE Failed',
    email: 'lead-bre-failed@lms.com',
    profile: {
      fullName: 'Anita Sharma',
      pan: 'FGHIJ5678K',
      dob: new Date('2005-01-10'),
      monthlySalary: 18_000,
      employmentMode: 'salaried',
      breStatus: 'failed',
      breFailures: ['Age must be between 23 and 50 (you are 21)', 'Monthly salary must be at least Rs 25,000'],
    },
  },
  {
    name: 'Lead Profile Only',
    email: 'lead-profile@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Priya Nair',
      pan: 'KLMNO9012P',
      breStatus: 'passed',
      breFailures: [],
    },
  },
  {
    name: 'Lead Ready',
    email: 'lead-ready@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Vikram Singh',
      pan: 'PQRST3456U',
      breStatus: 'passed',
      breFailures: [],
    },
  },
  {
    name: 'Demo Borrower',
    email: 'borrower@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Demo Borrower',
      breStatus: 'passed',
      breFailures: [],
    },
    loan: 'closed',
    principal: 120_000,
    tenureDays: 90,
  },
  {
    name: 'Applied Borrower',
    email: 'borrower-applied@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Meera Iyer',
      pan: 'UVWXY7890Z',
      breStatus: 'passed',
      breFailures: [],
    },
    loan: 'applied',
    principal: 80_000,
    tenureDays: 60,
  },
  {
    name: 'Sanctioned Borrower',
    email: 'borrower-sanctioned@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Arjun Patel',
      pan: 'ABCPQ1234L',
      breStatus: 'passed',
      breFailures: [],
    },
    loan: 'sanctioned',
    principal: 95_000,
    tenureDays: 75,
  },
  {
    name: 'Disbursed Borrower',
    email: 'borrower-disbursed@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Sneha Reddy',
      pan: 'LMNOP5678Q',
      breStatus: 'passed',
      breFailures: [],
    },
    loan: 'disbursed-partial',
    principal: 150_000,
    tenureDays: 120,
  },
  {
    name: 'Rejected Borrower',
    email: 'borrower-rejected@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'Karan Malhotra',
      pan: 'RSTUV9012W',
      breStatus: 'passed',
      breFailures: [],
    },
    loan: 'rejected',
    principal: 70_000,
    tenureDays: 45,
  },
  {
    name: 'E2E Borrower',
    email: 'borrower-e2e@lms.com',
    profile: {
      ...PASSED_PROFILE,
      fullName: 'E2E Test User',
      pan: 'WXYZA3456B',
      breStatus: 'passed',
      breFailures: [],
    },
    loan: 'applied',
    principal: 100_000,
    tenureDays: 90,
  },
];

interface SeedActors {
  sanction: Types.ObjectId;
  disbursement: Types.ObjectId;
  collection: Types.ObjectId;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function writeSeedSalarySlip(profile: IBorrowerProfile, label: string): ISalarySlip {
  fs.mkdirSync(env.salarySlipDir, { recursive: true });
  const filePath = path.join(env.salarySlipDir, `seed-${label}-salary-slip.pdf`);
  const pdf = buildSalarySlipPdf({
    employeeName: profile.fullName ?? label,
    pan: profile.pan,
    employmentMode: profile.employmentMode,
    monthlySalary: profile.monthlySalary,
  });
  fs.writeFileSync(filePath, pdf);
  return {
    path: filePath,
    originalName: `${label}-salary-slip.pdf`,
    mimeType: 'application/pdf',
    size: pdf.length,
    uploadedAt: daysAgo(14),
  };
}

function withSalarySlip(profile: IBorrowerProfile, label: string): IBorrowerProfile {
  return { ...profile, salarySlip: writeSeedSalarySlip(profile, label) };
}

function needsSalarySlip(seed: BorrowerSeed): boolean {
  return Boolean(seed.loan) || seed.email === 'lead-ready@lms.com';
}

async function upsertUser(
  name: string,
  email: string,
  role: Role,
  passwordHash: string,
  profile?: IBorrowerProfile,
): Promise<Types.ObjectId> {
  const update: Record<string, unknown> = { name, role, passwordHash };
  if (profile) update.profile = profile;

  const user = await User.findOneAndUpdate(
    { email },
    { $set: update },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );

  return user._id;
}

interface PaymentSeed {
  utr: string;
  amount: number;
  paidOn: Date;
}

function buildLoanDocument(
  borrowerId: Types.ObjectId,
  actors: SeedActors,
  kind: LoanSeedKind,
  principal: number,
  tenureDays: number,
): {
  loan: Record<string, unknown>;
  payments: PaymentSeed[];
} {
  const calc = calculateLoan(principal, tenureDays);
  const appliedAt = daysAgo(28);
  const sanctionedAt = daysAgo(24);
  const disbursedAt = daysAgo(20);
  const rejectedAt = daysAgo(22);
  const closedAt = daysAgo(2);

  const history: IStatusHistoryEntry[] = [
    { from: null, to: 'applied', by: borrowerId, at: appliedAt, note: 'Loan application submitted' },
  ];

  let status: LoanStatus = 'applied';
  let totalPaid = 0;
  let outstanding = calc.totalRepayment;
  let rejectionReason: string | undefined;
  let sanctionedBy: Types.ObjectId | undefined;
  let disbursedBy: Types.ObjectId | undefined;
  let closedAtValue: Date | undefined;
  const payments: PaymentSeed[] = [];

  if (kind === 'applied') {
    status = 'applied';
  } else if (kind === 'sanctioned') {
    status = 'sanctioned';
    sanctionedBy = actors.sanction;
    history.push({ from: 'applied', to: 'sanctioned', by: actors.sanction, at: sanctionedAt, note: 'Loan approved' });
  } else if (kind === 'rejected') {
    status = 'rejected';
    rejectionReason = 'Debt-to-income ratio exceeds policy limits';
    history.push({
      from: 'applied',
      to: 'rejected',
      by: actors.sanction,
      at: rejectedAt,
      note: rejectionReason,
    });
  } else {
    status = kind === 'closed' ? 'closed' : 'disbursed';
    sanctionedBy = actors.sanction;
    disbursedBy = actors.disbursement;
    history.push({ from: 'applied', to: 'sanctioned', by: actors.sanction, at: sanctionedAt, note: 'Loan approved' });
    history.push({ from: 'sanctioned', to: 'disbursed', by: actors.disbursement, at: disbursedAt, note: 'Loan disbursed' });

    if (kind === 'disbursed-partial') {
      const partialAmount = roundTo2(calc.totalRepayment * 0.35);
      totalPaid = partialAmount;
      outstanding = roundTo2(calc.totalRepayment - totalPaid);
      payments.push({
        utr: 'SEEDPARTIAL0012345678901234567890',
        amount: partialAmount,
        paidOn: daysAgo(8),
      });
    } else {
      totalPaid = calc.totalRepayment;
      outstanding = 0;
      closedAtValue = closedAt;
      history.push({ from: 'disbursed', to: 'closed', by: actors.collection, at: closedAt, note: 'Loan fully repaid' });
      payments.push({
        utr: 'SEEDUTRCLOSED0000000000000000000000',
        amount: calc.totalRepayment,
        paidOn: daysAgo(3),
      });
    }
  }

  return {
    loan: {
      borrower: borrowerId,
      ...calc,
      totalPaid,
      outstanding,
      status,
      rejectionReason,
      sanctionedBy,
      sanctionedAt: sanctionedBy ? sanctionedAt : undefined,
      disbursedBy,
      disbursedAt: disbursedBy ? disbursedAt : undefined,
      closedAt: closedAtValue,
      statusHistory: history,
      createdAt: appliedAt,
      updatedAt: closedAtValue ?? disbursedAt ?? rejectedAt ?? sanctionedAt ?? appliedAt,
    },
    payments,
  };
}

async function seed(): Promise<void> {
  await connectDb();
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const account of SEED_ACCOUNTS) {
    await upsertUser(account.name, account.email, account.role, passwordHash);
    console.log(`seeded ${account.role.padEnd(12)} ${account.email}`);
  }

  for (const borrower of SEED_BORROWERS) {
    let profile = borrower.profile;
    if (needsSalarySlip(borrower)) {
      profile = withSalarySlip(profile, borrower.email.split('@')[0] ?? 'borrower');
    }

    await upsertUser(borrower.name, borrower.email, 'borrower', passwordHash, profile);
    console.log(`seeded borrower     ${borrower.email}${borrower.loan ? ` (${borrower.loan})` : ' (sales lead)'}`);
  }

  const actorEmails = {
    admin: 'admin@lms.com',
    sanction: 'sanction@lms.com',
    disbursement: 'disbursement@lms.com',
    collection: 'collection@lms.com',
  } as const;

  const actorUsers = await User.find({ email: { $in: Object.values(actorEmails) } }).select('_id email');
  const actorMap = new Map(actorUsers.map((user) => [user.email, user._id]));

  const sanctionId = actorMap.get(actorEmails.sanction);
  const disbursementId = actorMap.get(actorEmails.disbursement);
  const collectionId = actorMap.get(actorEmails.collection);
  if (!sanctionId || !disbursementId || !collectionId) {
    throw new Error('Staff accounts missing — seed executive users before creating loans');
  }

  const actors: SeedActors = {
    sanction: sanctionId,
    disbursement: disbursementId,
    collection: collectionId,
  };

  const deletedPayments = await Payment.deleteMany({});
  const deletedLoans = await Loan.deleteMany({});
  console.log(`\ncleared ${deletedLoans.deletedCount} loans and ${deletedPayments.deletedCount} payments`);

  const borrowersWithLoans = SEED_BORROWERS.filter((b) => b.loan);
  const borrowerUsers = await User.find({
    email: { $in: borrowersWithLoans.map((b) => b.email) },
  }).select('_id email');

  const borrowerMap = Object.fromEntries(borrowerUsers.map((user) => [user.email, user._id])) as Record<string, Types.ObjectId>;

  for (const borrower of borrowersWithLoans) {
    const borrowerId = borrowerMap[borrower.email];
    if (!borrowerId || !borrower.loan) continue;

    const { loan, payments } = buildLoanDocument(
      borrowerId,
      actors,
      borrower.loan,
      borrower.principal ?? 100_000,
      borrower.tenureDays ?? 90,
    );

    const created = await Loan.create(loan);

    for (const payment of payments) {
      await Payment.create({
        loan: created._id,
        utr: payment.utr,
        amount: payment.amount,
        paidOn: payment.paidOn,
        recordedBy: actors.collection,
      });
    }

    console.log(`created loan          ${borrower.email} → ${created.status} (${payments.length} payment${payments.length === 1 ? '' : 's'})`);
  }

  const summary = await Loan.aggregate<{ _id: LoanStatus; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const statusLine = summary.map((row) => `${row._id}=${row.count}`).join(', ');

  console.log('\n--- Seed summary ---');
  console.log(`Password (all accounts): ${SEED_PASSWORD}`);
  console.log(`Pipeline counts: ${statusLine || 'none'}`);
  console.log('Sales leads: lead-pending@, lead-bre-failed@, lead-profile@, lead-ready@lms.com');
  console.log('Loan scenarios:');
  console.log('  borrower@lms.com           → closed (payment history / status QA)');
  console.log('  borrower-applied@lms.com   → applied (sanction queue + reject modal)');
  console.log('  borrower-sanctioned@lms.com → sanctioned (disbursement queue)');
  console.log('  borrower-disbursed@lms.com → disbursed partial (collection + history)');
  console.log('  borrower-rejected@lms.com  → rejected');
  console.log('  borrower-e2e@lms.com       → applied (full pipeline E2E smoke)');

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error('Seed failed', err);
  await disconnectDb();
  process.exit(1);
});
