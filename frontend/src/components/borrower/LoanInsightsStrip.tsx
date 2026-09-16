'use client';

import { Modal } from '@/components/ui/Modal';
import {
  estimatedMonthlyRepayment,
  incomeToRepaymentRatio,
  type LoanPlan,
} from '@/lib/loanMath';
import { formatCurrency } from '@/lib/format';
import { useState } from 'react';

interface LoanInsightsStripProps {
  plan: LoanPlan;
  monthlySalary?: number;
  onCompareTenures: () => void;
}

const actionClass =
  'text-[13px] font-semibold text-[var(--primary)] transition hover:text-[var(--primary-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30';

export function LoanInsightsStrip({ plan, monthlySalary, onCompareTenures }: LoanInsightsStripProps) {
  const [kfsOpen, setKfsOpen] = useState(false);
  const monthlyEquivalent = estimatedMonthlyRepayment(plan.totalRepayment, plan.tenureDays);
  const ratio = monthlySalary ? incomeToRepaymentRatio(monthlySalary, plan.totalRepayment, plan.tenureDays) : null;
  const showAffordability = monthlySalary != null && monthlySalary > 0;

  return (
    <>
      <div className="mt-3 border-t border-[var(--border)] py-2 lg:flex lg:min-h-[3rem] lg:items-center lg:justify-between lg:gap-6">
        <div className="min-w-0 text-[13px] leading-snug">
          {showAffordability ? (
            <p className="text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Affordability</span>
              {' · '}
              {formatCurrency(monthlySalary!, true)} income · {formatCurrency(monthlyEquivalent)} estimated equivalent
              {ratio != null && <> · {ratio}% ratio</>}
              {' · '}
              <span className="text-[var(--text-muted)]">Estimate only</span>
            </p>
          ) : (
            <p className="text-[var(--text-muted)]">Estimates based on your current loan selection.</p>
          )}
        </div>

        <div className="mt-2 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 lg:mt-0">
          <button type="button" className={actionClass} onClick={onCompareTenures}>
            Compare tenure →
          </button>
          <span className="hidden text-[#CBD5E1] sm:inline" aria-hidden>
            ·
          </span>
          <button type="button" className={actionClass} aria-expanded={kfsOpen} onClick={() => setKfsOpen(true)}>
            KFS details →
          </button>
        </div>
      </div>

      <Modal open={kfsOpen} onClose={() => setKfsOpen(false)} title="Key Fact Statement">
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Estimates only. Final rate, fees, APR and repayment terms are confirmed in the KFS.
        </p>
      </Modal>
    </>
  );
}
