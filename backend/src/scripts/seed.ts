import { connectDb, disconnectDb } from '../config/db';
import { User } from '../models/User';
import { hashPassword } from '../services/auth.service';
import type { Role } from '../types';

export const SEED_PASSWORD = 'Password@123';

export const SEED_ACCOUNTS: { name: string; email: string; role: Role }[] = [
  { name: 'Admin User', email: 'admin@lms.com', role: 'admin' },
  { name: 'Sales Executive', email: 'sales@lms.com', role: 'sales' },
  { name: 'Sanction Executive', email: 'sanction@lms.com', role: 'sanction' },
  { name: 'Disbursement Executive', email: 'disbursement@lms.com', role: 'disbursement' },
  { name: 'Collection Executive', email: 'collection@lms.com', role: 'collection' },
  { name: 'Demo Borrower', email: 'borrower@lms.com', role: 'borrower' },
];

async function seed(): Promise<void> {
  await connectDb();
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const account of SEED_ACCOUNTS) {
    const update: Record<string, unknown> = { name: account.name, role: account.role, passwordHash };
    const setOnInsert = account.role === 'borrower' ? { profile: { breStatus: 'pending', breFailures: [] } } : {};

    await User.updateOne(
      { email: account.email },
      { $set: update, $setOnInsert: setOnInsert },
      { upsert: true, runValidators: true },
    );
    console.log(`seeded ${account.role.padEnd(12)} ${account.email}`);
  }

  console.log(`\nAll accounts use password: ${SEED_PASSWORD}`);
  await disconnectDb();
}

seed().catch(async (err) => {
  console.error('Seed failed', err);
  await disconnectDb();
  process.exit(1);
});
