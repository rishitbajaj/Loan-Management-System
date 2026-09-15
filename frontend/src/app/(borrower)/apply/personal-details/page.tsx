'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { Alert, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { previewBre } from '@/lib/bre';
import { api, ApiError, errorMessage } from '@/lib/api';
import type { BreResult, EmploymentMode, UserDetail } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed' },
];

function toDateInput(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function PersonalDetailsPage() {
  const { me, loading, canAccess, refresh, activeLoan } = useBorrower();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({ fullName: '', pan: '', dob: '', monthlySalary: '', employmentMode: '' as EmploymentMode | '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiErr, setApiErr] = useState<ApiError | null>(null);
  const [bre, setBre] = useState<BreResult | null>(null);

  useEffect(() => {
    if (loading) return;
    if (activeLoan) router.replace('/apply/status');
  }, [loading, activeLoan, router]);

  useEffect(() => {
    if (!me) return;
    setForm({
      fullName: me.profile?.fullName ?? me.name ?? '',
      pan: me.profile?.pan ?? '',
      dob: toDateInput(me.profile?.dob),
      monthlySalary: me.profile?.monthlySalary != null ? String(me.profile.monthlySalary) : '',
      employmentMode: me.profile?.employmentMode ?? '',
    });
    if (me.profile?.breStatus === 'failed') setBre({ passed: false, failures: me.profile.breFailures });
    if (me.profile?.breStatus === 'passed') setBre({ passed: true, failures: [] });
  }, [me]);

  const hints = useMemo(
    () => previewBre({ pan: form.pan, dob: form.dob, monthlySalary: Number(form.monthlySalary) || 0, employmentMode: form.employmentMode }),
    [form],
  );

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = key === 'pan' ? e.target.value.toUpperCase() : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setApiErr(null);
    setSubmitting(true);
    try {
      const { data, message } = await api.put<{ user: UserDetail; bre: BreResult }>('/borrower/profile', {
        fullName: form.fullName,
        pan: form.pan,
        dob: form.dob,
        monthlySalary: Number(form.monthlySalary),
        employmentMode: form.employmentMode,
      });
      setBre(data.bre);
      await refresh();
      if (data.bre.passed) {
        success(message ?? 'Eligibility check passed');
        router.push('/apply/salary-slip');
      }
    } catch (err) {
      const parsed = err instanceof ApiError ? err : new ApiError(0, errorMessage(err));
      setApiErr(parsed);
      toastError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !canAccess('personal-details')) return <PageLoader />;

  return (
    <Card title="Personal details" description="We run an eligibility check on the server. All rules must pass before you can continue.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {apiErr && !apiErr.errors.length && <Alert kind="error">{apiErr.message}</Alert>}
        {bre && !bre.passed && (
          <Alert kind="error" title="Eligibility check failed">
            <ul className="list-disc pl-5">
              {bre.failures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Alert>
        )}
        {bre?.passed && <Alert kind="success">Eligibility check passed. You can continue to the salary slip step.</Alert>}
        {hints.length > 0 && !bre?.failures.length && (
          <Alert kind="warning" title="Likely to fail eligibility">
            <ul className="list-disc pl-5">
              {hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Input id="fullName" label="Full name" required value={form.fullName} onChange={set('fullName')} error={apiErr?.fieldMessage('fullName')} />
        <Input
          id="pan"
          label="PAN"
          required
          maxLength={10}
          value={form.pan}
          onChange={set('pan')}
          error={apiErr?.fieldMessage('pan')}
          hint="Format AAAAA9999A"
        />
        <Input id="dob" label="Date of birth" type="date" required value={form.dob} onChange={set('dob')} error={apiErr?.fieldMessage('dob')} hint="Age must be 23-50" />
        <Input
          id="monthlySalary"
          label="Monthly salary (Rs)"
          type="number"
          min={0}
          required
          value={form.monthlySalary}
          onChange={set('monthlySalary')}
          error={apiErr?.fieldMessage('monthlySalary')}
          hint="Minimum Rs 25,000"
        />
        <Select
          id="employmentMode"
          label="Employment mode"
          required
          placeholder="Select employment"
          options={EMPLOYMENT_OPTIONS}
          value={form.employmentMode}
          onChange={set('employmentMode')}
          error={apiErr?.fieldMessage('employmentMode')}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={submitting}>
            Save and check eligibility
          </Button>
        </div>
      </form>
    </Card>
  );
}
