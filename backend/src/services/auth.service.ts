import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type UserDocument } from '../models/User';
import type { AuthUser, Role } from '../types';
import { AppError } from '../utils/AppError';
import type { LoginInput, RegisterInput } from '../validation/auth.schema';

const BCRYPT_ROUNDS = 10;

export interface JwtPayload {
  sub: string;
  role: Role;
}

export function toAuthUser(user: UserDocument): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function signToken(user: UserDocument): string {
  const payload: JwtPayload = { sub: user.id, role: user.role };
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== 'object' || typeof decoded.sub !== 'string') {
      throw AppError.unauthorized('Invalid token');
    }
    return { sub: decoded.sub, role: decoded.role as Role };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Invalid or expired token');
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function register(input: RegisterInput): Promise<{ user: UserDocument; token: string }> {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) throw AppError.conflict('An account with this email already exists');

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: 'borrower',
    profile: { breStatus: 'pending', breFailures: [] },
  });

  return { user, token: signToken(user) };
}

export async function login(input: LoginInput): Promise<{ user: UserDocument; token: string }> {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new AppError(404, 'No account found with this email', [
      { field: 'email', message: 'No account found with this email' },
    ]);
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Incorrect password');

  return { user, token: signToken(user) };
}
