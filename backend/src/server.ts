import fs from 'node:fs';
import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

async function main(): Promise<void> {
  fs.mkdirSync(env.salarySlipDir, { recursive: true });
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
