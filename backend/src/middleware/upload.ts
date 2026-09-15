import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { requireUser } from './auth';

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(env.salarySlipDir, { recursive: true });
    cb(null, env.salarySlipDir);
  },
  filename(req, file, cb) {
    const ext = ALLOWED_MIME[file.mimetype] ?? '';
    cb(null, `${requireUser(req).id}-${randomUUID()}${ext}`);
  },
});

export const salarySlipUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME[file.mimetype]) return cb(null, true);
    cb(AppError.validation('Only PDF, JPG and PNG files are allowed', [{ field: 'file', message: 'Unsupported file type' }]));
  },
}).single('file');
