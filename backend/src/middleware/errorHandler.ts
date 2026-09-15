import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError, type FieldError } from '../utils/AppError';

interface ErrorBody {
  success: false;
  message: string;
  errors?: FieldError[];
  stack?: string;
}

function isMongoDuplicateKey(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

function isCastError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: string }).name === 'CastError';
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` } satisfies ErrorBody);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  const body: ErrorBody = { success: false, message: 'Internal server error' };

  if (err instanceof AppError) {
    status = err.statusCode;
    body.message = err.message;
    if (err.errors?.length) body.errors = err.errors;
  } else if (err instanceof ZodError) {
    status = 422;
    body.message = 'Validation failed';
    body.errors = err.issues.map((issue) => ({ field: issue.path.join('.') || 'body', message: issue.message }));
  } else if (err instanceof MulterError) {
    status = 422;
    body.message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 5 MB limit' : err.message;
    body.errors = [{ field: err.field ?? 'file', message: body.message }];
  } else if (isMongoDuplicateKey(err)) {
    status = 409;
    const field = Object.keys(err.keyValue ?? {})[0];
    body.message = field ? `A record with this ${field} already exists` : 'Duplicate record';
  } else if (isCastError(err)) {
    status = 404;
    body.message = 'Resource not found';
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    body.message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (!env.isProduction && err instanceof Error) {
      body.message = err.message;
      body.stack = err.stack;
    }
  }

  res.status(status).json(body);
}
