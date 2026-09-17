'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BreBadge, StatusBadge } from '@/components/StatusBadge';
import { BorrowerLoanTimeline } from '@/components/borrower/BorrowerLoanTimeline';
import { SalarySlipDocumentRow } from '@/components/borrower/SalarySlipPreviewModal';
import { SanctionLoanActions } from '@/components/dashboard/SanctionLoanActions';
import { sectionLabelClass, Surface } from '@/components/ui/Card';
import { employmentLabel, incomeProofDescription, requiresIncomeProof } from '@/lib/employment-labels';
import { isEstimateStatus, loanEndDateLabel } from '@/lib/borrower-application';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { borrowerOf, type Loan } from '@/lib/types';

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface>
      <div className="border-b border-[var(--border-light)] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="px-5 py-4 sm:px-6">{children}</div>
    </Surface>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border-light)] py-3 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className={sectionLabelClass}>{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-primary)] sm:text-right">{value}</dd>
    </div>
  );
}

function borrowerName(loan: Loan) {
  const b = borrowerOf(loan);
  return b?.profile?.fullName || b?.name || 'Borrower';
}

function formatIncome(value?: number) {
  if (value == null) return 'Not provided';
  return `${formatCurrency(value, true)} / month`;
}

export function ApplicationDetailView({
  loan,
  backHref,
  backLabel,
  onRefresh,
}: {
  loan: Loan;
  backHref: string;
  backLabel: string;
  onRefresh: () => void | Promise<void>;
}) {
  const borrower = borrowerOf(loan);
  const profile = borrower?.profile;
  const endDate = loanEndDateLabel(loan);
  const estimate = isEstimateStatus(loan.status);
  const needsProof = requiresIncomeProof(profile?.employmentMode);
  const slip = profile?.salarySlip;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="text-sm font-semibold text-[var(--primary)] transition hover:text-[var(--primary-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
        >
          ← {backLabel}
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{borrowerName(loan)}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{borrower?.email ?? '—'}</p>
            <p className="mt-2 font-mono text-xs text-[var(--text-secondary)]">Application #{loan._id}</p>
          </div>
          <StatusBadge status={loan.status} size="md" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:items-start">
        <div className="space-y-6">
          <DetailSection title="Personal information">
            <dl>
              <DetailRow label="Full name" value={profile?.fullName ?? borrower?.name ?? 'Not provided'} />
              <DetailRow label="Date of birth" value={profile?.dob ? formatDate(profile.dob) : 'Not provided'} />
              <DetailRow label="PAN" value={profile?.pan ?? 'Not provided'} />
            </dl>
          </DetailSection>

          <DetailSection title="Employment & income">
            <dl>
              <DetailRow label="Employment status" value={employmentLabel(profile?.employmentMode)} />
              <DetailRow label="Monthly income" value={formatIncome(profile?.monthlySalary)} />
              <DetailRow label="Eligibility check" value={<BreBadge status={profile?.breStatus ?? 'pending'} />} />
            </dl>
          </DetailSection>

          <DetailSection title="Income history">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              No historical income records are available for this application.
            </p>
            {profile?.monthlySalary != null && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Current declared monthly income: {formatIncome(profile.monthlySalary)}
              </p>
            )}
          </DetailSection>

          <DetailSection title="Documents">
            <dl>
              <DetailRow label="PAN" value={profile?.pan ? 'Provided' : 'Not provided'} />
              <DetailRow
                label="Income proof"
                value={slip ? 'Uploaded' : needsProof ? 'Pending' : 'Not required'}
              />
              {needsProof && !slip && (
                <DetailRow
                  label="Accepted formats"
                  value={<span className="text-[var(--text-secondary)]">{incomeProofDescription(profile?.employmentMode)}</span>}
                />
              )}
              {slip && <DetailRow label="Uploaded on" value={formatDateTime(slip.uploadedAt)} />}
            </dl>
            {slip ? (
              <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                <p className={sectionLabelClass}>Salary slip</p>
                <div className="mt-3">
                  <SalarySlipDocumentRow slip={slip} endpoint={`/loans/${loan._id}/salary-slip`} />
                </div>
              </div>
            ) : (
              needsProof && (
                <p className="mt-4 text-sm text-[var(--text-muted)]">No income proof has been uploaded yet.</p>
              )
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Application summary">
            <dl>
              <DetailRow label="Application date" value={formatDate(loan.createdAt)} />
              <DetailRow label="Loan amount" value={formatCurrency(loan.principal)} />
              <DetailRow label="Tenure" value={`${loan.tenureDays} days`} />
              {endDate && <DetailRow label={endDate.label} value={endDate.value} />}
            </dl>
          </DetailSection>

          <DetailSection title="Loan details">
            <dl>
              <DetailRow label="Interest rate" value={`${loan.interestRate}% p.a.`} />
              <DetailRow
                label={estimate ? 'Estimated interest' : 'Interest'}
                value={formatCurrency(loan.interest)}
              />
              <DetailRow
                label={estimate ? 'Estimated total repayment' : 'Total repayment'}
                value={formatCurrency(loan.totalRepayment)}
              />
              <DetailRow label="Outstanding" value={formatCurrency(loan.outstanding)} />
            </dl>
          </DetailSection>

          <DetailSection title="Application timeline">
            <BorrowerLoanTimeline loan={loan} />
          </DetailSection>

          {loan.status === 'applied' && (
            <DetailSection title="Actions">
              <SanctionLoanActions loan={loan} onComplete={onRefresh} layout="stack" />
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}
