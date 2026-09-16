import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  '/etc/secrets/.env',
  '/etc/secrets/atlas-credentials.env',
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: false });
  }
}

function unquote(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.trim().replace(/^['"]|['"]$/g, '');
}

for (const key of ['MONGODB_URI', 'MONGODB_URL', 'MONGO_URI', 'JWT_SECRET', 'CLIENT_URL', 'UPLOAD_DIR']) {
  const cleaned = unquote(process.env[key]);
  if (cleaned !== undefined) process.env[key] = cleaned;
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = process.env.MONGODB_URL || process.env.MONGO_URI;
}

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
  const present = ['MONGODB_URI', 'MONGO_URI', 'JWT_SECRET', 'CLIENT_URL', 'NODE_ENV', 'PORT']
    .map((key) => `${key}=${process.env[key] ? 'yes' : 'no'}`)
    .join(', ');
  console.error(`Invalid environment configuration:\n${details}`);
  console.error(`Keys present: ${present}`);
  console.error('On Render: Environment -> Add Environment Variable. Key must be exactly MONGODB_URI.');
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
