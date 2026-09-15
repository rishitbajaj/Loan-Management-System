'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
      <h1 className="text-xl font-semibold text-slate-900">Create your borrower account</h1>
      <p className="mt-1 text-sm text-slate-500">Step 1 of 4 - it takes about five minutes to apply.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
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
          Sign up
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
