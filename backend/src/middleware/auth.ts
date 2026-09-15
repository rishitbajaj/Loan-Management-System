import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { toAuthUser, verifyToken } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const payload = verifyToken(header.slice('Bearer '.length).trim());
  const user = await User.findById(payload.sub);
  if (!user) throw AppError.unauthorized('User no longer exists');

  req.user = toAuthUser(user);
  next();
}

export function requireUser(req: Request): NonNullable<Request['user']> {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}
