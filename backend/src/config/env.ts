import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

const clientOrigins = parsed.data.CLIENT_URL.split(',')
  .map((value) => value.trim())
  .filter(Boolean);

for (const origin of clientOrigins) {
  try {
    new URL(origin);
  } catch {
    console.error(`Invalid CLIENT_URL origin: ${origin}`);
    process.exit(1);
  }
}

export const env = {
  ...parsed.data,
  clientOrigins,
  isProduction: parsed.data.NODE_ENV === 'production',
  salarySlipDir: path.resolve(process.cwd(), parsed.data.UPLOAD_DIR, 'salary-slips'),
};
