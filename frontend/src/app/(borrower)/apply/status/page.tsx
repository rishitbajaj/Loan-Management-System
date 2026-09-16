'use client';

import { ApplicationStatusHero } from '@/components/borrower/ApplicationStatusHero';
import { BorrowerLoanSummary } from '@/components/borrower/BorrowerLoanSummary';
import { BorrowerLoanTimeline } from '@/components/borrower/BorrowerLoanTimeline';
import { PaymentHistorySection } from '@/components/borrower/PaymentHistorySection';
import { WhatHappensNext } from '@/components/borrower/WhatHappensNext';
import { useBorrower } from '@/components/borrower/BorrowerContext';
import { BorrowerPageIntro, FormActions } from '@/components/borrower/BorrowerPageIntro';
import { EmptyState, Surface } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { BORROWER_STATUS_LABELS, canReapply, showWhatHappensNext } from '@/lib/borrower-application';
import { api, errorMessage } from '@/lib/api';
import { sectionLabelClass } from '@/lib/ui-classes';
import type { Loan, Payment } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StatusPage() {
  const { loading, canAccess, latestLoan, refresh } = useBorrower();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payError, setPayError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!canAccess('status')) router.replace('/apply/personal-details');
  }, [loading, canAccess, router]);

  useEffect(() => {
    if (!latestLoan || (latestLoan.status !== 'disbursed' && latestLoan.status !== 'closed')) {
      setPayments([]);
      return;
    }
    let cancelled = false;
    api
      .get<{ payments: Payment[] }>(`/loans/${latestLoan._id}/payments`)
      .then(({ data }) => {
        if (!cancelled) setPayments(data.payments);
      })
      .catch((err) => {
        if (!cancelled) setPayError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [latestLoan?._id, latestLoan?.status, latestLoan?.totalPaid]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!latestLoan) {
    return (
      <div>
        <BorrowerPageIntro title="Application status" description="Track your loan from application through closure." />
        <Surface>
          <EmptyState title="No loan yet" description="Complete the application to see your status here." />
        </Surface>
      </div>
    );
  }

  const showPayments = latestLoan.status === 'disbursed' || latestLoan.status === 'closed';
  const showNext = showWhatHappensNext(latestLoan.status);
  const allowReapply = canReapply(latestLoan.status);

  return (
    <div className="space-y-5">
      <BorrowerPageIntro
        title={latestLoan.status === 'disbursed' ? 'Active loan' : latestLoan.status === 'closed' ? 'Loan closed' : 'Application status'}
        description={
          latestLoan.status === 'disbursed'
            ? 'Track repayments and your loan balance.'
            : latestLoan.status === 'closed'
              ? 'Your loan has been fully repaid.'
              : 'Track your loan from application through closure.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-[var(--radius-pill)] bg-[var(--primary-light)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
              {BORROWER_STATUS_LABELS[latestLoan.status]}
            </span>
            <Button type="button" variant="secondary" size="sm" loading={refreshing} onClick={() => void handleRefresh()}>
              Refresh status
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-5">
          <ApplicationStatusHero loan={latestLoan} />

          {latestLoan.status === 'disbursed' && (
            <ActiveLoanHighlight loan={latestLoan} />
          )}

          {latestLoan.status === 'closed' && (
            <ClosedLoanHighlight loan={latestLoan} />
          )}

          <section aria-labelledby="application-journey-heading">
            <p id="application-journey-heading" className={sectionLabelClass}>
              Application journey
            </p>
            <Surface className="mt-2 px-4 py-4 sm:px-5">
              <BorrowerLoanTimeline loan={latestLoan} />
            </Surface>
          </section>

          {showPayments && (
            <PaymentHistorySection payments={payments} error={payError} />
          )}

          {allowReapply && (
            <Surface className="p-4 sm:p-5">
              <p className="text-sm text-[var(--text-secondary)]">
                You may review your application details and apply again when eligible.
              </p>
              <FormActions className="pt-3">
                <Button
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    await refresh();
                    router.push('/apply/loan');
                  }}
                >
                  Apply again
                </Button>
              </FormActions>
            </Surface>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[calc(var(--topbar-height)+1rem)]">
          <BorrowerLoanSummary loan={latestLoan} />
          {showNext && <WhatHappensNext status={latestLoan.status} />}
          <KfsSection />
        </aside>
      </div>
    </div>
  );
}

function ActiveLoanHighlight({ loan }: { loan: Loan }) {
  return (
    <Surface className="border-[var(--primary)]/20 bg-[var(--primary-soft)] p-4 sm:p-5">
      <p className={sectionLabelClass}>Active loan</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Your loan is active. Repayments will reduce your outstanding balance.
      </p>
      {loan.disbursedAt && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Disbursed on{' '}
          <span className="font-medium text-[var(--text-secondary)]">
            {new Date(loan.disbursedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </p>
      )}
    </Surface>
  );
}

function ClosedLoanHighlight({ loan }: { loan: Loan }) {
  return (
    <Surface className="border-emerald-200 bg-[var(--success-bg)] p-4 sm:p-5">
      <p className="text-sm font-semibold text-emerald-900">Loan successfully completed</p>
      {loan.closedAt && (
        <p className="mt-1 text-xs text-emerald-800">
          Closed on{' '}
          {new Date(loan.closedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}
    </Surface>
  );
}

function KfsSection() {
  return (
    <Surface className="p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Key Fact Statement</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Your final loan terms will be provided in your Key Fact Statement.
      </p>
    </Surface>
  );
}
