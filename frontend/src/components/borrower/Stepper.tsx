'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBorrower, type BorrowerStep } from './BorrowerContext';

const STEPS: { key: BorrowerStep; label: string; shortLabel: string; href: string }[] = [
  { key: 'personal-details', label: 'Personal', shortLabel: '1', href: '/apply/personal-details' },
  { key: 'salary-slip', label: 'Documents', shortLabel: '2', href: '/apply/salary-slip' },
  { key: 'loan', label: 'Loan', shortLabel: '3', href: '/apply/loan' },
  { key: 'status', label: 'Status', shortLabel: '4', href: '/apply/status' },
];

export function Stepper() {
  const pathname = usePathname();
  const { me, loans, canAccess } = useBorrower();

  const done: Record<BorrowerStep, boolean> = {
    'personal-details': me?.profile?.breStatus === 'passed',
    'salary-slip': !!me?.profile?.salarySlip,
    loan: loans.length > 0,
    status: loans.length > 0,
  };

  const compact = pathname.startsWith('/apply/loan');

  return (
    <nav aria-label="Application progress" className={`overflow-x-auto ${compact ? 'mb-3' : 'mb-8'}`}>
      <ol className={`flex min-w-[320px] items-center ${compact ? 'h-9' : ''}`}>
        {STEPS.map((step, index) => {
          const active = pathname.startsWith(step.href);
          const accessible = canAccess(step.key);
          const completed = done[step.key] && !active;
          const state = active ? 'active' : completed ? 'done' : accessible ? 'todo' : 'locked';

          const circle = (
            <span
              className={`flex shrink-0 items-center justify-center rounded-full font-semibold transition duration-200 ${
                compact ? 'h-9 w-9 text-xs' : 'h-8 w-8 text-xs'
              } ${
                state === 'active'
                  ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]'
                  : state === 'done'
                    ? 'bg-[var(--success-bg)] text-[var(--success)] ring-2 ring-[var(--success)]/15'
                    : 'border border-[var(--border)] bg-white text-[var(--text-disabled)]'
              }`}
            >
              {state === 'done' ? '✓' : step.shortLabel}
            </span>
          );

          const label = (
            <span
              className={`mt-2 text-xs font-medium sm:mt-0 ${
                state === 'active'
                  ? 'text-[var(--primary)]'
                  : state === 'done'
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-muted)]'
              }`}
            >
              {step.label}
            </span>
          );

          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              {accessible ? (
                <Link href={step.href} className="flex flex-col items-center gap-0 sm:flex-row sm:gap-2.5">
                  {circle}
                  {label}
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-0 sm:flex-row sm:gap-2.5">
                  {circle}
                  {label}
                </div>
              )}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-2 hidden h-px flex-1 sm:block ${completed || active ? 'bg-[var(--primary)]/30' : 'bg-[var(--border)]'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
