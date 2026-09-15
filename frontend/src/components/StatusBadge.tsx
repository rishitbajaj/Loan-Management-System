import type { BreStatus, LoanStatus } from '@/lib/types';

const LOAN_STYLES: Record<LoanStatus, string> = {
  applied: 'bg-amber-100 text-amber-800',
  sanctioned: 'bg-sky-100 text-sky-800',
  rejected: 'bg-red-100 text-red-800',
  disbursed: 'bg-indigo-100 text-indigo-800',
  closed: 'bg-emerald-100 text-emerald-800',
};

const BRE_STYLES: Record<BreStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  passed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LOAN_STYLES[status]}`}>{status}</span>;
}

export function BreBadge({ status }: { status: BreStatus }) {
  const label = status === 'passed' ? 'BRE passed' : status === 'failed' ? 'BRE failed' : 'BRE pending';
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${BRE_STYLES[status]}`}>{label}</span>;
}
