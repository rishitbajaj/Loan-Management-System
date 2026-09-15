'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';
import type { AuthUser } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
      login(data.token, data.user);
      router.replace(homeFor(data.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, errorMessage(err)));
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-500">Borrowers and executives use the same login.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && !error.errors.length && <Alert kind="error">{error.message}</Alert>}
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.fieldMessage('email')}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.fieldMessage('password')}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New borrower?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
