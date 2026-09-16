'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Card';
import { getApplicationChecklist } from '@/lib/borrower-application';
import { formatCalendarDateDisplay, type LoanPlan } from '@/lib/loanMath';
import { formatCurrency } from '@/lib/format';
import type { UserDetail } from '@/lib/types';

interface LoanReviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plan: LoanPlan;
  me: UserDetail | null;
  submitting: boolean;
  submitError: string | null;
}

export function LoanReviewModal({ open, onClose, onConfirm, plan, me, submitting, submitError }: LoanReviewModalProps) {
  const checklist = getApplicationChecklist(me, true);

  return (
    <Modal
      open={open}
      title="Review your loan application"
      description="Please review your selected loan details before submitting."
      onClose={onClose}
      preventClose={submitting}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Back
          </Button>
          <Button type="button" onClick={onConfirm} loading={submitting} disabled={submitting}>
            {submitting ? 'Submitting application...' : 'Submit application'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {submitError && (
          <Alert kind="error" title="Unable to submit your application">
            {submitError}
            <p className="mt-1 text-sm">Your information has not been submitted. Please try again.</p>
          </Alert>
        )}

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Loan details</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <ReviewRow label="Loan amount" value={formatCurrency(plan.principal)} />
            <ReviewRow label="Interest rate" value={`${plan.interestRate}% p.a.`} />
            <ReviewRow label="Tenure" value={`${plan.tenureDays} days`} />
            <ReviewRow label="Estimated start date" value={formatCalendarDateDisplay(plan.startDate)} />
            <ReviewRow label="Estimated end date" value={formatCalendarDateDisplay(plan.endDate)} />
            <ReviewRow label="Estimated interest" value={formatCurrency(plan.interest)} />
            <div className="border-t border-[var(--border-light)] pt-3">
              <ReviewRow label="Estimated total repayment" value={formatCurrency(plan.totalRepayment)} emphasize />
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            These figures are estimates based on your current selection. Final loan terms, applicable fees and repayment
            schedule will be provided with your Key Fact Statement.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Application summary</h3>
          <ul className="mt-3 space-y-2">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    item.complete
                      ? 'bg-[var(--success-bg)] text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-[var(--warning-bg)] text-amber-700 ring-1 ring-amber-200'
                  }`}
                  aria-hidden
                >
                  {item.complete ? '✓' : '○'}
                </span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-[var(--text-muted)]">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--background)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Key Fact Statement</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Your final loan terms will be provided in the Key Fact Statement after approval.
          </p>
        </section>
      </div>
    </Modal>
  );
}

function ReviewRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className={`tabular-nums ${emphasize ? 'text-base font-bold text-[var(--primary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
        {value}
      </dd>
    </div>
  );
}
