'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { CountBadge, EmptyState, ErrorState, PageHeader, sectionLabelClass, Surface } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/Table';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/format';
import { homeFor } from '@/lib/rbac';
import { borrowerEmailClass, borrowerNameClass, moneyStrongClass } from '@/lib/ui-classes';
import { borrowerOf, type Loan } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

function borrowerName(loan: Loan) {
  const b = borrowerOf(loan);
  return b?.profile?.fullName || b?.name || 'Borrower';
}

function borrowerEmail(loan: Loan) {
  return borrowerOf(loan)?.email ?? '—';
}

function ActiveLoansEmptyIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function ActiveLoansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: Loan[] }>(
    '/dashboard/collection/loans?status=disbursed',
  );

  const activeLoans = useMemo(
    () => (data?.loans ?? []).filter((loan) => loan.status === 'disbursed'),
    [data],
  );

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') router.replace(homeFor(user.role));
  }, [user, router]);

  if (!user) return <PageLoader />;
  if (user.role !== 'admin') return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Active loans"
        description="Currently disbursed loans that are open for repayment."
        actions={
          !loading && data ? (
            <CountBadge>
              {activeLoans.length} active loan{activeLoans.length === 1 ? '' : 's'}
            </CountBadge>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : !activeLoans.length ? (
        <Surface>
          <EmptyState
            icon={<ActiveLoansEmptyIcon />}
            title="No active loans"
            description="Disbursed loans that have not yet been closed will appear here."
          />
        </Surface>
      ) : (
        <>
          <Surface className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>Borrower</Th>
                  <Th align="right">Principal</Th>
                  <Th>Tenure</Th>
                  <Th>Disbursed</Th>
                  <Th>Status</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Outstanding</Th>
                </tr>
              </Thead>
              <Tbody>
                {activeLoans.map((loan) => (
                  <Tr key={loan._id}>
                    <Td>
                      <div>
                        <p className={borrowerNameClass}>{borrowerName(loan)}</p>
                        <p className={borrowerEmailClass}>{borrowerEmail(loan)}</p>
                      </div>
                    </Td>
                    <Td align="right">{formatCurrency(loan.principal)}</Td>
                    <Td>{loan.tenureDays} days</Td>
                    <Td className="whitespace-nowrap text-[var(--text-secondary)]">
                      {loan.disbursedAt ? formatDate(loan.disbursedAt) : '—'}
                    </Td>
                    <Td>
                      <StatusBadge status={loan.status} />
                    </Td>
                    <Td align="right">{formatCurrency(loan.totalPaid)}</Td>
                    <Td align="right">
                      <span className={moneyStrongClass}>{formatCurrency(loan.outstanding)}</span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Surface>

          <div className="space-y-3 md:hidden">
            {activeLoans.map((loan) => (
              <Surface key={loan._id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={borrowerNameClass}>{borrowerName(loan)}</p>
                    <p className={borrowerEmailClass}>{borrowerEmail(loan)}</p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className={sectionLabelClass}>Principal</dt>
                    <dd className="mt-0.5 tabular-nums">{formatCurrency(loan.principal)}</dd>
                  </div>
                  <div>
                    <dt className={sectionLabelClass}>Tenure</dt>
                    <dd className="mt-0.5">{loan.tenureDays} days</dd>
                  </div>
                  <div>
                    <dt className={sectionLabelClass}>Disbursed</dt>
                    <dd className="mt-0.5">{loan.disbursedAt ? formatDate(loan.disbursedAt) : '—'}</dd>
                  </div>
                  <div>
                    <dt className={sectionLabelClass}>Paid</dt>
                    <dd className="mt-0.5 tabular-nums">{formatCurrency(loan.totalPaid)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={sectionLabelClass}>Outstanding</dt>
                    <dd className={`mt-0.5 ${moneyStrongClass}`}>{formatCurrency(loan.outstanding)}</dd>
                  </div>
                </dl>
              </Surface>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
