'use client';

import { Surface } from '@/components/ui/Card';
import { formatCalendarDateDisplay, type LoanPlan } from '@/lib/loanMath';
import { formatCurrency } from '@/lib/format';
import type { ReactNode } from 'react';

function RepaymentBreakdown({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total <= 0) return null;
  const principalPct = Math.round((principal / total) * 100);
  const interestPct = Math.round((interest / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--border-light)]">
        <span className="h-full bg-[var(--primary)]/70" style={{ width: `${principalPct}%` }} aria-hidden />
        <span className="h-full bg-[var(--border)]" style={{ width: `${interestPct}%` }} aria-hidden />
      </div>
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>Principal {principalPct}%</span>
        <span>Interest {interestPct}%</span>
      </div>
    </div>
  );
}

function SummaryPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] font-medium text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums leading-tight text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

interface LoanEstimatedRepaymentProps {
  plan: LoanPlan;
}

export function LoanEstimatedRepayment({ plan }: LoanEstimatedRepaymentProps) {
  return (
    <Surface className="p-5">
      <header>
        <h2 className="text-lg font-semibold leading-tight text-[var(--text-primary)]">Your repayment</h2>
        <p className="mt-1 text-[13px] leading-snug text-[var(--text-muted)]">Estimated based on your current selection.</p>
      </header>

      <div className="mt-3">
        <p className="text-[13px] font-medium text-[var(--text-muted)]">Estimated total</p>
        <p className="mt-1 text-[36px] font-bold leading-none tabular-nums tracking-[-0.03em] text-[var(--primary)]">
          {formatCurrency(plan.totalRepayment)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
        <SummaryPair label="Principal" value={formatCurrency(plan.principal)} />
        <SummaryPair label="Interest" value={formatCurrency(plan.interest)} />
        <SummaryPair label="Interest rate" value={`${plan.interestRate}% p.a.`} />
        <SummaryPair label="Tenure" value={`${plan.tenureDays} days`} />
        <SummaryPair label="Start date" value={formatCalendarDateDisplay(plan.startDate)} />
        <SummaryPair label="Expected end date" value={formatCalendarDateDisplay(plan.endDate)} />
      </dl>

      <div className="mt-3 border-t border-[var(--border-light)] pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Interest breakdown</p>
        <div className="mt-2">
          <RepaymentBreakdown principal={plan.principal} interest={plan.interest} />
        </div>
      </div>
    </Surface>
  );
}
