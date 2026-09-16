'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/types';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get('email')?.trim() ?? '';
  const fromLogin = searchParams.has('email');
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: prefilledEmail, password: '', confirm: '' });
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError(new ApiError(422, 'Validation failed', [{ field: 'confirm', message: 'Passwords do not match' }]));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(data.token, data.user);
      router.replace('/apply/personal-details');
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, errorMessage(err)));
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-[28px] font-bold tracking-[-0.025em] text-[var(--text-primary)]">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Borrower Portal — a few minutes to apply.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {fromLogin && prefilledEmail && (
          <Alert kind="info" title="No account found">
            We couldn&apos;t find an account for <span className="font-semibold">{prefilledEmail}</span>. Create one to start your application.
          </Alert>
        )}
        {error && !error.errors.length && <Alert kind="error">{error.message}</Alert>}
        <Input id="name" label="Full name" autoComplete="name" required value={form.name} onChange={set('name')} error={error?.fieldMessage('name')} />
        <Input id="email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={error?.fieldMessage('email')} />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set('password')}
          error={error?.fieldMessage('password')}
          hint="At least 8 characters"
        />
        <Input
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={set('confirm')}
          error={error?.fieldMessage('confirm')}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          {submitting ? 'Creating account...' : 'Start application'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-[var(--primary)] underline-offset-2 hover:text-[var(--primary-hover)]">
          Log in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
