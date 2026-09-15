'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { Alert, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { calculateLoan, MAX_PRINCIPAL, MAX_TENURE_DAYS, MIN_PRINCIPAL, MIN_TENURE_DAYS } from '@/lib/loanMath';
import type { Loan } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

export default function LoanConfigPage() {
  const { loading, canAccess, refresh, activeLoan } = useBorrower();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [principal, setPrincipal] = useState(100_000);
  const [tenureDays, setTenureDays] = useState(180);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (activeLoan) router.replace('/apply/status');
    else if (!canAccess('loan')) router.replace('/apply/personal-details');
  }, [loading, activeLoan, canAccess, router]);

  const calc = useMemo(() => calculateLoan(principal, tenureDays), [principal, tenureDays]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { message } = await api.post<{ loan: Loan }>('/loans', { principal, tenureDays });
      await refresh();
      success(message ?? 'Loan application submitted');
      router.push('/apply/status');
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !canAccess('loan')) return <PageLoader />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <Card title="Configure your loan" description="Interest is fixed at 12% p.a. using simple interest. The backend recalculates these figures when you apply.">
        <form onSubmit={onSubmit} className="space-y-6">
          {error && <Alert kind="error">{error}</Alert>}
          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="principal" className="font-medium text-slate-700">
                Loan amount
              </label>
              <span className="font-semibold text-slate-900">{formatCurrency(principal, true)}</span>
            </div>
            <input
              id="principal"
              type="range"
              min={MIN_PRINCIPAL}
              max={MAX_PRINCIPAL}
              step={5000}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(MIN_PRINCIPAL, true)} - {formatCurrency(MAX_PRINCIPAL, true)}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="tenure" className="font-medium text-slate-700">
                Tenure
              </label>
              <span className="font-semibold text-slate-900">{tenureDays} days</span>
            </div>
            <input
              id="tenure"
              type="range"
              min={MIN_TENURE_DAYS}
              max={MAX_TENURE_DAYS}
              step={1}
              value={tenureDays}
              onChange={(e) => setTenureDays(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <p className="mt-1 text-xs text-slate-500">
              {MIN_TENURE_DAYS} - {MAX_TENURE_DAYS} days
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={submitting}>
              Apply
            </Button>
          </div>
        </form>
      </Card>

      <aside className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Live calculation</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Principal</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(calc.principal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Rate</dt>
            <dd className="font-medium text-slate-900">{calc.interestRate}% p.a.</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Tenure</dt>
            <dd className="font-medium text-slate-900">{calc.tenureDays} days</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Interest (SI)</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(calc.interest)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-indigo-200 pt-3 text-base">
            <dt className="font-semibold text-slate-800">Total repayment</dt>
            <dd className="font-semibold text-indigo-800">{formatCurrency(calc.totalRepayment)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-indigo-800/80">SI = (P x R x T) / (365 x 100)</p>
      </aside>
    </div>
  );
}
