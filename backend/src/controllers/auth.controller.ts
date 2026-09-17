import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { markPart } from '../utils/requestTiming';
import { loginSchema, registerSchema } from '../validation/auth.schema';

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const { user, token } = await authService.register(input);
  sendCreated(res, { token, user: authService.toAuthUser(user) }, 'Account created');
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const { user, token } = await authService.login(input);
  sendSuccess(res, { token, user: authService.toAuthUser(user) }, 'Logged in');
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = req.userDoc;
  if (!user) throw AppError.notFound('User not found');
  markPart('userDoc=reused');
  sendSuccess(res, { user: authService.toPublicUser(user) });
}
