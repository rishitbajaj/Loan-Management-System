'use client';

import Link from 'next/link';
import { LoanPipeline } from '@/components/dashboard/LoanPipeline';
import { StatusBadge } from '@/components/StatusBadge';
import { Alert, PageHeader, sectionLabelClass, StatCard, Surface } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage, isAbortError, peekCachedGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { DashboardSummary, LoanStatus } from '@/lib/types';
import { useEffect, useState } from 'react';

const QUEUES: (
  | { label: string; href: string; hint: string; valueKey: 'leads' }
  | { label: string; href: string; hint: string; status: Extract<LoanStatus, 'applied' | 'sanctioned' | 'disbursed'> }
)[] = [
  { label: 'Sales', href: '/dashboard/sales', valueKey: 'leads', hint: 'Borrowers who have not applied' },
  { label: 'Sanction', href: '/dashboard/sanction', status: 'applied', hint: 'Applied loans in review' },
  { label: 'Disbursement', href: '/dashboard/disbursement', status: 'sanctioned', hint: 'Sanctioned, not yet released' },
  { label: 'Collection', href: '/dashboard/collection', status: 'disbursed', hint: 'Disbursed loans' },
];

export function AdminOverview() {
  const cached = peekCachedGet<DashboardSummary>('/dashboard/summary');
  const [summary, setSummary] = useState<DashboardSummary | null>(cached?.data ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const hit = peekCachedGet<DashboardSummary>('/dashboard/summary');
    if (hit) setSummary(hit.data);
    api
      .get<DashboardSummary>('/dashboard/summary', { fresh: true, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setSummary(data);
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(errorMessage(err));
      });
    return () => controller.abort();
  }, []);

  const metrics = summary
    ? [
        {
          label: 'Total borrowers',
          value: String(summary.totalBorrowers),
          context: 'Registered borrowers',
          href: '/dashboard/sales',
        },
        {
          label: 'Sales leads',
          value: String(summary.leads),
          context: 'Not yet applied',
          href: '/dashboard/sales',
        },
        {
          label: 'Active loans',
          value: String(summary.totalLoans),
          context: 'All loan records',
          href: '/dashboard/active-loans',
        },
        {
          label: 'Outstanding',
          value: formatCurrency(summary.outstanding),
          context: 'Amount due',
          emphasize: true,
          href: '/dashboard/collection',
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Monitor borrowers, loan pipeline, money movement and pending operations."
      />

      {error ? <Alert kind="error">{error}</Alert> : null}
      {!summary && !error ? <PageLoader /> : null}

      {summary ? (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} context={m.context} emphasize={m.emphasize} href={m.href} />
            ))}
          </section>

          <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
            <Surface>
              <LoanPipeline loansByStatus={summary.loansByStatus} />

              <div className="flex items-center justify-between gap-4 border-t border-[var(--border-light)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <StatusBadge status="rejected" />
                  <p className="text-sm text-[var(--text-muted)]">Terminal outcome — not in the forward pipeline</p>
                </div>
                <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">{summary.loansByStatus.rejected}</p>
              </div>
            </Surface>

            <div className="flex flex-col gap-5">
              <Surface>
                <div className="border-b border-[var(--border-light)] px-6 py-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Book</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Figures on disbursed and closed loans.</p>
                </div>
                <dl className="divide-y divide-[var(--border-light)]">
                  <div className="flex items-baseline justify-between gap-4 px-6 py-4">
                    <dt className={sectionLabelClass}>Disbursed principal</dt>
                    <dd className="text-base font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(summary.disbursedPrincipal)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 px-6 py-4">
                    <dt className={sectionLabelClass}>Outstanding</dt>
                    <dd className="text-base font-bold tabular-nums text-[var(--primary)]">{formatCurrency(summary.outstanding)}</dd>
                  </div>
                </dl>
              </Surface>

              <Surface>
                <div className="border-b border-[var(--border-light)] px-6 py-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Operations queues</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Work waiting in each module.</p>
                </div>
                <ul className="divide-y divide-[var(--border-light)]">
                  {QUEUES.map((q) => {
                    const count = 'valueKey' in q ? summary.leads : summary.loansByStatus[q.status];
                    return (
                      <li key={q.label}>
                        <Link
                          href={q.href}
                          className="flex items-center justify-between gap-3 px-6 py-4 transition duration-150 hover:bg-[var(--background)]"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{q.label}</p>
                            <p className="text-sm text-[var(--text-muted)]">{q.hint}</p>
                          </div>
                          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{count}</p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Surface>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
