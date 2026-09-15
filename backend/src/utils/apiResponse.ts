import type { Response } from 'express';

export interface SuccessBody<T> {
  success: true;
  message?: string;
  data: T;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const body: SuccessBody<T> = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}
