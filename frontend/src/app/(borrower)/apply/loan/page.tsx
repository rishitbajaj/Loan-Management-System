'use client';

import { ApplicationSubmittedModal } from '@/components/borrower/ApplicationSubmittedModal';
import { CompareTenuresModal } from '@/components/borrower/CompareTenuresModal';
import { LoanEstimatedRepayment } from '@/components/borrower/LoanEstimatedRepayment';
import { LoanInsightsStrip } from '@/components/borrower/LoanInsightsStrip';
import { LoanReviewModal } from '@/components/borrower/LoanReviewModal';
import { useBorrower } from '@/components/borrower/BorrowerContext';
import { BorrowerPageIntro } from '@/components/borrower/BorrowerPageIntro';
import { Alert, Surface } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  calculateLoanPlan,
  COMPARE_TENURE_OPTIONS,
  MAX_PRINCIPAL,
  MAX_TENURE_DAYS,
  MIN_PRINCIPAL,
  MIN_TENURE_DAYS,
  todayCalendarDate,
} from '@/lib/loanMath';
import type { Loan } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

const SLIDER_CLASS =
  'mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--border-light)] accent-[var(--primary)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-sm';

export default function LoanConfigPage() {
  const { me, loading, canAccess, refresh, activeLoan } = useBorrower();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [principal, setPrincipal] = useState(100_000);
  const [tenureDays, setTenureDays] = useState(180);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLoan, setSubmittedLoan] = useState<Loan | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const startDate = useMemo(() => todayCalendarDate(), []);
  const plan = useMemo(() => calculateLoanPlan(principal, tenureDays, startDate), [principal, tenureDays, startDate]);
  const monthlyIncome = me?.profile?.monthlySalary;

  useEffect(() => {
    if (loading) return;
    if (activeLoan) router.replace('/apply/status');
    else if (!canAccess('loan')) router.replace('/apply/personal-details');
  }, [loading, activeLoan, canAccess, router]);

  function onApplyClick(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (principal < MIN_PRINCIPAL || principal > MAX_PRINCIPAL) {
      setError(`Loan amount must be between ${formatCurrency(MIN_PRINCIPAL, true)} and ${formatCurrency(MAX_PRINCIPAL, true)}`);
      return;
    }
    if (tenureDays < MIN_TENURE_DAYS || tenureDays > MAX_TENURE_DAYS) {
      setError(`Tenure must be between ${MIN_TENURE_DAYS} and ${MAX_TENURE_DAYS} days`);
      return;
    }
    setSubmitError(null);
    setReviewOpen(true);
  }

  async function onConfirmSubmit() {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<{ loan: Loan }>('/loans', { principal, tenureDays });
      await refresh();
      setReviewOpen(false);
      setSubmittedLoan(data.loan);
      setSuccessOpen(true);
      success('Loan application submitted.');
    } catch (err) {
      const message = errorMessage(err);
      setSubmitError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function onSuccessContinue() {
    setSuccessOpen(false);
    router.push('/apply/status');
  }

  if (loading || !canAccess('loan')) return <PageLoader />;

  return (
    <div>
      <BorrowerPageIntro
        dense
        title="Configure your loan"
        description="12% p.a. fixed simple interest on your selected amount and tenure."
      />

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
        <Surface className="p-5">
          <form onSubmit={onApplyClick}>
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your loan</h2>
              <p className="mt-1 text-[13px] leading-snug text-[var(--text-muted)]">Choose your amount and repayment period.</p>
            </header>

            {error && (
              <div className="mb-3">
                <Alert kind="error">{error}</Alert>
              </div>
            )}

            <div>
              <label htmlFor="principal" className="text-[13px] font-medium text-[var(--text-muted)]">
                Loan amount
              </label>
              <p className="mt-1.5 text-[28px] font-bold tabular-nums tracking-[-0.03em] text-[var(--primary)]">
                {formatCurrency(principal, true)}
              </p>
              <input
                id="principal"
                type="range"
                min={MIN_PRINCIPAL}
                max={MAX_PRINCIPAL}
                step={5000}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className={SLIDER_CLASS}
                aria-valuemin={MIN_PRINCIPAL}
                aria-valuemax={MAX_PRINCIPAL}
                aria-valuenow={principal}
              />
              <div className="mt-2 grid grid-cols-3 text-xs tabular-nums text-[var(--text-muted)]">
                <span>{formatCurrency(MIN_PRINCIPAL, true)}</span>
                <span className="text-center font-semibold text-[var(--text-primary)]">{formatCurrency(principal, true)}</span>
                <span className="text-right">{formatCurrency(MAX_PRINCIPAL, true)}</span>
              </div>
            </div>

            <div className="mt-[18px]">
              <label htmlFor="tenure" className="text-[13px] font-medium text-[var(--text-muted)]">
                Tenure
              </label>
              <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]">{tenureDays} days</p>
              <input
                id="tenure"
                type="range"
                min={MIN_TENURE_DAYS}
                max={MAX_TENURE_DAYS}
                step={1}
                value={tenureDays}
                onChange={(e) => setTenureDays(Number(e.target.value))}
                className={SLIDER_CLASS}
                aria-valuemin={MIN_TENURE_DAYS}
                aria-valuemax={MAX_TENURE_DAYS}
                aria-valuenow={tenureDays}
              />
              <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
                <span>{MIN_TENURE_DAYS} days</span>
                <span className="font-semibold text-[var(--text-primary)]">{tenureDays} selected</span>
                <span>{MAX_TENURE_DAYS} days</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="submit" loading={submitting}>
                Apply for loan →
              </Button>
            </div>
          </form>
        </Surface>

        <LoanEstimatedRepayment plan={plan} />
      </div>

      <LoanInsightsStrip plan={plan} monthlyIncome={monthlyIncome} onCompareTenures={() => setCompareOpen(true)} />

      <CompareTenuresModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        principal={principal}
        selectedTenure={tenureDays}
        startDate={startDate}
        tenures={COMPARE_TENURE_OPTIONS}
      />

      <LoanReviewModal
        open={reviewOpen}
        onClose={() => {
          if (submitting) return;
          setReviewOpen(false);
          setSubmitError(null);
        }}
        onConfirm={onConfirmSubmit}
        plan={plan}
        me={me}
        submitting={submitting}
        submitError={submitError}
      />

      <ApplicationSubmittedModal open={successOpen} loan={submittedLoan} onContinue={onSuccessContinue} />
    </div>
  );
}
