'use client';

import {
  BORROWER_HERO_TITLES,
  borrowerStatusDescription,
  submittedTimestamp,
} from '@/lib/borrower-application';
import { formatDateTime } from '@/lib/format';
import type { Loan, LoanStatus } from '@/lib/types';

const HERO_STYLES: Record<LoanStatus, { container: string; title: string; body: string }> = {
  applied: {
    container: 'border-cyan-200 bg-[var(--info-bg)]',
    title: 'text-cyan-950',
    body: 'text-cyan-900',
  },
  sanctioned: {
    container: 'border-emerald-200 bg-[var(--success-bg)]',
    title: 'text-emerald-900',
    body: 'text-emerald-800',
  },
  rejected: {
    container: 'border-red-200 bg-[var(--danger-bg)]',
    title: 'text-red-900',
    body: 'text-red-800',
  },
  disbursed: {
    container: 'border-[var(--border)] bg-[var(--surface)]',
    title: 'text-[var(--text-primary)]',
    body: 'text-[var(--text-secondary)]',
  },
  closed: {
    container: 'border-emerald-200 bg-[var(--success-bg)]',
    title: 'text-emerald-900',
    body: 'text-emerald-800',
  },
};

export function ApplicationStatusHero({ loan }: { loan: Loan }) {
  const styles = HERO_STYLES[loan.status];
  const title = BORROWER_HERO_TITLES[loan.status];
  const description =
    loan.status === 'rejected' && loan.rejectionReason
      ? loan.rejectionReason
      : borrowerStatusDescription(loan.status);
  const submitted = submittedTimestamp(loan);

  return (
    <section aria-labelledby="application-status-heading" className={`rounded-[var(--radius-lg)] border p-4 sm:p-5 ${styles.container}`}>
      <p id="application-status-heading" className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Application status
      </p>
      <h2 className={`mt-2 text-2xl font-bold tracking-tight ${styles.title}`}>{title}</h2>
      <p className={`mt-1.5 text-sm leading-relaxed ${styles.body}`}>{description}</p>

      {submitted && (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Submitted <span className="font-medium text-[var(--text-secondary)]">{formatDateTime(submitted)}</span>
        </p>
      )}
    </section>
  );
}
