'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBorrower, type BorrowerStep } from './BorrowerContext';

const STEPS: { key: BorrowerStep; label: string; href: string }[] = [
  { key: 'personal-details', label: 'Personal details', href: '/apply/personal-details' },
  { key: 'salary-slip', label: 'Salary slip', href: '/apply/salary-slip' },
  { key: 'loan', label: 'Loan & apply', href: '/apply/loan' },
  { key: 'status', label: 'Status', href: '/apply/status' },
];

export function Stepper() {
  const pathname = usePathname();
  const { me, loans, canAccess } = useBorrower();

  const done: Record<BorrowerStep, boolean> = {
    'personal-details': me?.profile?.breStatus === 'passed',
    'salary-slip': !!me?.profile?.salarySlip,
    loan: loans.length > 0,
    status: false,
  };

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STEPS.map((step, index) => {
        const active = pathname.startsWith(step.href);
        const accessible = canAccess(step.key);
        const state = active ? 'active' : done[step.key] ? 'done' : accessible ? 'todo' : 'locked';
        const styles = {
          active: 'border-indigo-600 bg-indigo-50 text-indigo-700',
          done: 'border-emerald-300 bg-emerald-50 text-emerald-800',
          todo: 'border-slate-200 bg-white text-slate-700',
          locked: 'border-slate-200 bg-slate-50 text-slate-400',
        }[state];

        const content = (
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
              {state === 'done' ? '\u2713' : index + 2}
            </span>
            <span className="truncate text-sm font-medium">{step.label}</span>
          </span>
        );

        return (
          <li key={step.key} className={`rounded-lg border px-3 py-2 ${styles}`}>
            {accessible ? <Link href={step.href}>{content}</Link> : content}
          </li>
        );
      })}
    </ol>
  );
}
