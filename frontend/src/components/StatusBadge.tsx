import type { BreStatus, LoanStatus } from '@/lib/types';

const LOAN_STYLES: Record<LoanStatus, string> = {
  applied: 'bg-[var(--primary-light)] text-[var(--primary)]',
  sanctioned: 'bg-[var(--success-bg)] text-[#059669]',
  rejected: 'bg-[var(--danger-bg)] text-[#DC2626]',
  disbursed: 'bg-[var(--info-bg)] text-[var(--info)]',
  closed: 'bg-[var(--border-light)] text-[var(--text-secondary)]',
};

const LOAN_LABELS: Record<LoanStatus, string> = {
  applied: 'Applied',
  sanctioned: 'Sanctioned',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  closed: 'Closed',
};

const BRE_STYLES: Record<BreStatus, string> = {
  pending: 'bg-[var(--warning-bg)] text-[#D97706]',
  passed: 'bg-[var(--success-bg)] text-[#059669]',
  failed: 'bg-[var(--danger-bg)] text-[#DC2626]',
};

const SIZES = {
  sm: 'px-2.5 py-[5px] text-xs',
  md: 'px-2.5 py-[5px] text-xs',
  lg: 'px-3 py-1.5 text-xs uppercase tracking-wide',
};

const BASE = 'inline-flex rounded-[var(--radius-pill)] font-semibold';

export function StatusBadge({ status, size = 'sm' }: { status: LoanStatus; size?: keyof typeof SIZES }) {
  return <span className={`${BASE} ${SIZES[size]} ${LOAN_STYLES[status]}`}>{LOAN_LABELS[status]}</span>;
}

export function BreBadge({ status }: { status: BreStatus }) {
  const label = status === 'passed' ? 'BRE passed' : status === 'failed' ? 'BRE failed' : 'BRE pending';
  return <span className={`${BASE} px-2.5 py-[5px] text-xs ${BRE_STYLES[status]}`}>{label}</span>;
}

export function UploadBadge({ uploaded }: { uploaded: boolean }) {
  return (
    <span
      className={`${BASE} px-2.5 py-[5px] text-xs ${
        uploaded ? 'bg-[var(--success-bg)] text-[#059669]' : 'bg-[var(--warning-bg)] text-[#D97706]'
      }`}
    >
      {uploaded ? 'Uploaded' : 'Pending'}
    </span>
  );
}
