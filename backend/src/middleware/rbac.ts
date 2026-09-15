import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../types';
import { AppError } from '../utils/AppError';
import { requireUser } from './auth';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = requireUser(req);
    if (!roles.includes(user.role)) {
      throw AppError.forbidden(`This action requires one of the roles: ${roles.join(', ')}`);
    }
    next();
  };
}
