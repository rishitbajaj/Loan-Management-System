'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { BorrowerInput, BorrowerSelect } from '@/components/borrower/BorrowerField';
import { BorrowerPageIntro, FormActions } from '@/components/borrower/BorrowerPageIntro';
import { Alert, Card, SectionLabel } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, errorMessage } from '@/lib/api';
import { getAgeValidationError, PAN_REGEX } from '@/lib/bre';
import type { BreResult, EmploymentMode, UserDetail } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed' },
];

function toDateInput(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function classifyFailure(message: string): { label: string; text: string } {
  const lower = message.toLowerCase();
  if (lower.includes('age')) return { label: 'Age', text: message };
  if (lower.includes('salary')) return { label: 'Salary', text: message };
  if (lower.includes('pan')) return { label: 'PAN', text: message };
  if (lower.includes('employ') || lower.includes('unemployed')) return { label: 'Employment', text: message };
  return { label: 'Eligibility', text: message };
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

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = key === 'pan' ? e.target.value.toUpperCase() : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const panValid = form.pan.length === 10 && PAN_REGEX.test(form.pan);
  const panError =
    apiErr?.fieldMessage('pan') ?? (form.pan.length === 10 && !PAN_REGEX.test(form.pan) ? 'Invalid PAN format' : undefined);
  const panHint = panError ? undefined : panValid ? 'Valid PAN format' : 'Format: AAAAA9999A';

  const dobAgeError = getAgeValidationError(form.dob);
  const dobError = apiErr?.fieldMessage('dob') ?? dobAgeError;
  const dobValid = !!form.dob && !dobError;

  const employmentValid = !!form.employmentMode && !apiErr?.fieldMessage('employmentMode');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setApiErr(null);
    setSubmitting(true);
    try {
      const { data } = await api.put<{ user: UserDetail; bre: BreResult }>('/borrower/profile', {
        fullName: form.fullName,
        pan: form.pan,
        dob: form.dob,
        monthlySalary: Number(form.monthlySalary),
        employmentMode: form.employmentMode,
      });
      setBre(data.bre);
      await refresh();
      if (data.bre.passed) {
        success('Eligibility check passed');
        router.push('/apply/salary-slip');
      }
    } catch (err) {
      const parsed = err instanceof ApiError ? err : new ApiError(0, errorMessage(err));
      setApiErr(parsed);
      if (!parsed.errors.length) toastError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !canAccess('personal-details')) return <PageLoader />;

  return (
    <div>
      <BorrowerPageIntro
        title="Let's get to know you"
        description="Enter your personal details to continue your loan application."
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {apiErr && !apiErr.errors.length && <Alert kind="error">{apiErr.message}</Alert>}
          {bre && !bre.passed && (
            <Alert kind="error" title="Eligibility check failed">
              <dl className="mt-2 space-y-2">
                {bre.failures.map((f) => {
                  const item = classifyFailure(f);
                  return (
                    <div key={f}>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-800">{item.label}</dt>
                      <dd>{item.text}</dd>
                    </div>
                  );
                })}
              </dl>
            </Alert>
          )}
          {bre?.passed && <Alert kind="success" title="Eligibility check passed" />}

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionLabel className="sm:col-span-2">Personal information</SectionLabel>
            <BorrowerInput
              id="fullName"
              label="Full name"
              required
              value={form.fullName}
              onChange={set('fullName')}
              error={apiErr?.fieldMessage('fullName')}
              valid={!!form.fullName.trim() && !apiErr?.fieldMessage('fullName')}
            />
            <BorrowerInput
              id="dob"
              label="Date of birth"
              type="date"
              required
              value={form.dob}
              onChange={set('dob')}
              error={dobError}
              hint={dobError ? undefined : 'Age must be 23–50'}
              valid={dobValid}
            />
            <BorrowerInput
              id="pan"
              label="PAN"
              required
              maxLength={10}
              value={form.pan}
              onChange={set('pan')}
              error={panError}
              hint={panHint}
              valid={panValid && !panError}
            />
            <BorrowerInput
              id="monthlySalary"
              label="Monthly salary (₹)"
              type="number"
              min={0}
              required
              value={form.monthlySalary}
              onChange={set('monthlySalary')}
              error={apiErr?.fieldMessage('monthlySalary')}
              hint={apiErr?.fieldMessage('monthlySalary') ? undefined : 'Minimum ₹25,000'}
              valid={!!form.monthlySalary && Number(form.monthlySalary) >= 25000 && !apiErr?.fieldMessage('monthlySalary')}
            />

            <SectionLabel className="sm:col-span-2">Employment information</SectionLabel>
            <BorrowerSelect
              id="employmentMode"
              label="Employment mode"
              required
              placeholder="Select employment"
              options={EMPLOYMENT_OPTIONS}
              value={form.employmentMode}
              onChange={set('employmentMode')}
              error={apiErr?.fieldMessage('employmentMode')}
              valid={employmentValid}
              className="sm:col-span-2"
            />
          </div>

          <FormActions>
            <Button type="submit" className="w-full sm:w-auto" loading={submitting}>
              {submitting ? 'Checking...' : 'Continue'}
            </Button>
          </FormActions>
        </form>
      </Card>
    </div>
  );
}
