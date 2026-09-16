'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';
import type { AuthUser } from '@/lib/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operations = searchParams.get('from') === 'operations';
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
      const parsed = err instanceof ApiError ? err : new ApiError(0, errorMessage(err));
      if (!operations && parsed.status === 404 && parsed.fieldMessage('email')) {
        router.replace(`/register?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(parsed);
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-[28px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">{operations ? 'Operations login' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {operations ? 'You will be redirected to your operations module.' : 'Sign in to the Borrower Portal or Operations Dashboard.'}
      </p>

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
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        New borrower?{' '}
        <Link href="/register" className="font-semibold text-[var(--primary)] underline-offset-2 hover:text-[var(--primary-hover)]">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
