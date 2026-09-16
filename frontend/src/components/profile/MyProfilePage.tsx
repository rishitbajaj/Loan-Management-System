'use client';

import { SalarySlipDocumentRow } from '@/components/borrower/SalarySlipPreviewModal';
import { UserAvatar } from '@/components/UserAvatar';
import { BreBadge, StatusBadge, UploadBadge } from '@/components/StatusBadge';
import { Alert, Card, Surface } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { BORROWER_STATUS_LABELS } from '@/lib/borrower-application';
import { formatRoleLabel, homeFor, isExecutive, modulesForRole } from '@/lib/rbac';
import { sectionLabelClass } from '@/lib/ui-classes';
import type { EmploymentMode, Loan, UserDetail } from '@/lib/types';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

const EMPLOYMENT_LABELS: Record<EmploymentMode, string> = {
  salaried: 'Salaried',
  'self-employed': 'Self-employed',
  unemployed: 'Unemployed',
};

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border-light)] py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-sm text-[var(--text-muted)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-primary)] sm:max-w-[60%] sm:text-right">{value}</dd>
    </div>
  );
}

export function MyProfilePage() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const meRes = await api.get<{ user: UserDetail }>('/auth/me');
        if (cancelled) return;
        setUser(meRes.data.user);
        if (meRes.data.user.role === 'borrower') {
          const loansRes = await api.get<{ loans: Loan[] }>('/loans/me');
          if (!cancelled) setLoans(loansRes.data.loans);
        } else {
          setLoans([]);
        }
        setError(null);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader />;
  if (error || !user) {
    return (
      <Card>
        <Alert kind="error">{error ?? 'Could not load your profile.'}</Alert>
      </Card>
    );
  }

  const profile = user.profile;
  const latestLoan = loans[0] ?? null;
  const executiveModules = isExecutive(user.role) ? modulesForRole(user.role) : [];

  return (
    <div className="space-y-6">
      <Surface className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar name={user.name} size={56} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{user.name}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{user.email}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--primary)]">{formatRoleLabel(user.role)}</p>
          </div>
        </div>
      </Surface>

      <Card title="Account">
        <dl>
          <ProfileRow label="Display name" value={user.name} />
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Role" value={formatRoleLabel(user.role)} />
          <ProfileRow label="Member since" value={formatDate(user.createdAt)} />
        </dl>
      </Card>

      {user.role === 'borrower' && (
        <>
          <Card title="Personal details" description="Information from your loan application.">
            <dl>
              <ProfileRow label="Full name" value={profile?.fullName ?? '—'} />
              <ProfileRow label="PAN" value={profile?.pan ?? '—'} />
              <ProfileRow label="Date of birth" value={profile?.dob ? formatDate(profile.dob) : '—'} />
              <ProfileRow
                label="Monthly salary"
                value={profile?.monthlySalary != null ? formatCurrency(profile.monthlySalary, true) : '—'}
              />
              <ProfileRow
                label="Employment"
                value={profile?.employmentMode ? EMPLOYMENT_LABELS[profile.employmentMode] : '—'}
              />
            </dl>
          </Card>

          <Card title="Eligibility & documents">
            <dl>
              <ProfileRow
                label="Eligibility check"
                value={profile?.breStatus ? <BreBadge status={profile.breStatus} /> : '—'}
              />
              <ProfileRow
                label="Salary slip"
                value={<UploadBadge uploaded={!!profile?.salarySlip} />}
              />
              {profile?.salarySlip && (
                <>
                  <ProfileRow label="Uploaded on" value={formatDateTime(profile.salarySlip.uploadedAt)} />
                  <div className="border-b border-[var(--border-light)] py-3 last:border-b-0">
                    <p className="text-sm text-[var(--text-muted)]">Document</p>
                    <SalarySlipDocumentRow slip={profile.salarySlip} />
                  </div>
                </>
              )}
              {profile?.breStatus === 'failed' && profile.breFailures.length > 0 && (
                <div className="pt-3">
                  <p className={sectionLabelClass}>Eligibility notes</p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                    {profile.breFailures.map((failure) => (
                      <li key={failure}>• {failure}</li>
                    ))}
                  </ul>
                </div>
              )}
            </dl>
          </Card>

          {latestLoan && (
            <Card title="Current application" description="Your latest loan on record.">
              <dl>
                <ProfileRow label="Status" value={<StatusBadge status={latestLoan.status} />} />
                <ProfileRow label="Borrower-facing status" value={BORROWER_STATUS_LABELS[latestLoan.status]} />
                <ProfileRow label="Loan amount" value={formatCurrency(latestLoan.principal, true)} />
                <ProfileRow label="Tenure" value={`${latestLoan.tenureDays} days`} />
                <ProfileRow label="Interest rate" value={`${latestLoan.interestRate}% p.a.`} />
                <ProfileRow label="Total repayment" value={formatCurrency(latestLoan.totalRepayment)} />
                {(latestLoan.status === 'disbursed' || latestLoan.status === 'closed') && (
                  <ProfileRow label="Outstanding" value={formatCurrency(latestLoan.outstanding)} />
                )}
              </dl>
              <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                <Link href="/apply/status" className="text-sm font-semibold text-[var(--primary)] hover:underline">
                  View full application status →
                </Link>
              </div>
            </Card>
          )}
        </>
      )}

      {executiveModules.length > 0 && (
        <Card title="Workspace access" description="Modules available to your role.">
          <ul className="space-y-2">
            {executiveModules.map((module) => (
              <li key={module.key}>
                <Link href={module.href} className="block rounded-[var(--radius-md)] border border-[var(--border-light)] px-4 py-3 transition hover:bg-[var(--background)]">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{module.label}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{module.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {user.role === 'admin' && (
        <Card title="Administrator">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            You have full access to all lending workflows, including overview metrics and every operational module.
          </p>
          <div className="mt-4">
            <Link href="/dashboard" className="text-sm font-semibold text-[var(--primary)] hover:underline">
              Go to admin overview →
            </Link>
          </div>
        </Card>
      )}

      <div>
        <Link href={homeFor(user.role)} className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)]">
          ← Back to {user.role === 'borrower' ? 'application' : 'dashboard'}
        </Link>
      </div>
    </div>
  );
}
