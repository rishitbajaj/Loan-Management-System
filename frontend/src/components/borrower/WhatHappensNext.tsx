import { getWhatHappensNextSteps } from '@/lib/borrower-application';
import { Surface } from '@/components/ui/Card';
import { sectionLabelClass } from '@/lib/ui-classes';
import type { LoanStatus } from '@/lib/types';

export function WhatHappensNext({ status }: { status: LoanStatus }) {
  const steps = getWhatHappensNextSteps(status);
  if (steps.length === 0) return null;

  return (
    <Surface className="p-4 sm:p-5" aria-labelledby="what-happens-next-heading">
      <p id="what-happens-next-heading" className={sectionLabelClass}>
        What happens next?
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface)] px-3 py-2.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-semibold text-[var(--primary)]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
              <p className="mt-0.5 text-sm leading-snug text-[var(--text-muted)]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Surface>
  );
}
