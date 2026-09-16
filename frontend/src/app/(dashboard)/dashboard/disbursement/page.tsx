'use client';

import { useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { CountBadge, EmptyState, ErrorState, ModalSummaryBox, PageHeader, sectionLabelClass, Surface } from '@/components/ui/Card';
import { borrowerEmailClass, borrowerNameClass, moneyPrimaryClass, moneyStrongClass } from '@/lib/ui-classes';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { borrowerOf, type Loan } from '@/lib/types';
import { useState } from 'react';

type DisbursementLoan = Loan & {
  sanctionedBy?: string | { _id: string; name: string; email?: string };
};

function borrowerName(loan: Loan) {
  const b = borrowerOf(loan);
  return b?.profile?.fullName || b?.name || 'Borrower';
}

function borrowerEmail(loan: Loan) {
  return borrowerOf(loan)?.email ?? '—';
}

function sanctionedByLabel(loan: DisbursementLoan) {
  const by = loan.sanctionedBy;
  if (!by) return '—';
  if (typeof by === 'object' && by.name) return by.name;
  return '—';
}

function DisburseEmptyIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DisburseButton({
  loan,
  busyId,
  onClick,
  className = '',
}: {
  loan: Loan;
  busyId: string | null;
  onClick: (loan: Loan) => void;
  className?: string;
}) {
  const isBusy = busyId === loan._id;
  return (
    <Button size="sm" className={className} loading={isBusy} onClick={() => onClick(loan)}>
      {isBusy ? 'Disbursing...' : 'Disburse funds'}
    </Button>
  );
}

export default function DisbursementPage() {
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: DisbursementLoan[] }>('/dashboard/disbursement/loans');
  const { success, error: toastError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<DisbursementLoan | null>(null);

  const loans = data?.loans ?? [];

  async function disburse() {
    if (!confirming) return;
    setBusyId(confirming._id);
    try {
      await api.patch(`/loans/${confirming._id}/disburse`);
      success('Funds disbursed successfully.');
      setConfirming(null);
      await refresh();
    } catch (err) {
      toastError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div>
        <PageHeader
          title="Disbursement"
          description="Release funds for sanctioned loans."
          actions={
            !loading && data ? (
              <CountBadge>
                {loans.length} loan{loans.length === 1 ? '' : 's'} ready for disbursement
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
        ) : !loans.length ? (
          <Surface>
            <EmptyState
              icon={<DisburseEmptyIcon />}
              title="No loans ready for disbursement"
              description="Sanctioned applications will appear here once they are approved."
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
                    <Th align="right">Interest</Th>
                    <Th align="right">Total repayment</Th>
                    <Th>Sanctioned date</Th>
                    <Th>Sanctioned by</Th>
                    <Th align="right" className="w-[1%] whitespace-nowrap">
                      Action
                    </Th>
                  </tr>
                </Thead>
                <Tbody>
                  {loans.map((loan) => (
                    <Tr key={loan._id}>
                      <Td>
                        <div>
                          <p className={borrowerNameClass}>{borrowerName(loan)}</p>
                          <p className={borrowerEmailClass}>{borrowerEmail(loan)}</p>
                        </div>
                      </Td>
                      <Td align="right">
                        <span className={moneyPrimaryClass}>{formatCurrency(loan.principal)}</span>
                      </Td>
                      <Td>{loan.tenureDays} days</Td>
                      <Td align="right">{formatCurrency(loan.interest)}</Td>
                      <Td align="right">{formatCurrency(loan.totalRepayment)}</Td>
                      <Td>{loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}</Td>
                      <Td className="text-[var(--text-secondary)]">{sanctionedByLabel(loan)}</Td>
                      <Td align="right">
                        <DisburseButton loan={loan} busyId={busyId} onClick={setConfirming} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Surface>

            <div className="space-y-3 md:hidden">
              {loans.map((loan) => (
                <Surface key={loan._id} className="p-4">
                  <div>
                    <p className={borrowerNameClass}>{borrowerName(loan)}</p>
                    <p className={borrowerEmailClass}>{borrowerEmail(loan)}</p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className={sectionLabelClass}>Principal</dt>
                      <dd className={`mt-0.5 ${moneyPrimaryClass}`}>{formatCurrency(loan.principal)}</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Tenure</dt>
                      <dd className="mt-0.5">{loan.tenureDays} days</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Interest</dt>
                      <dd className="mt-0.5 tabular-nums">{formatCurrency(loan.interest)}</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Total repayment</dt>
                      <dd className="mt-0.5 tabular-nums">{formatCurrency(loan.totalRepayment)}</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Sanctioned date</dt>
                      <dd className="mt-0.5">{loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Sanctioned by</dt>
                      <dd className="mt-0.5 text-[var(--text-secondary)]">{sanctionedByLabel(loan)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <DisburseButton loan={loan} busyId={busyId} onClick={setConfirming} className="w-full sm:w-auto" />
                  </div>
                </Surface>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!confirming}
        title="Disburse loan?"
        onClose={() => setConfirming(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button loading={!!busyId} onClick={disburse}>
              {busyId ? 'Disbursing...' : 'Disburse funds'}
            </Button>
          </>
        }
      >
        {confirming && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              You are about to release funds to this borrower. Please confirm the details below.
            </p>
            <ModalSummaryBox label="Amount to disburse" value={formatCurrency(confirming.principal)} emphasize />
            <dl className="divide-y divide-[var(--border-light)] rounded-[var(--radius-md)] border border-[var(--border)] text-sm">
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Borrower</dt>
                <dd className="text-right font-semibold text-[var(--text-primary)]">{borrowerName(confirming)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Tenure</dt>
                <dd className="text-right tabular-nums">{confirming.tenureDays} days</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[var(--text-muted)]">Total repayment</dt>
                <dd className={`text-right ${moneyStrongClass}`}>{formatCurrency(confirming.totalRepayment)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
