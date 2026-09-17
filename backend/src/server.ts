import './config/queryTiming';
import fs from 'node:fs';
import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { User } from './models/User';
import { seedDatabase } from './scripts/seed';

async function maybeSeed(): Promise<void> {
  if ((await User.countDocuments()) === 0) {
    console.log('No users in the database. Seeding demo accounts...');
    await seedDatabase();
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(env.salarySlipDir, { recursive: true });
  await connectDb();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  await maybeSeed();
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
