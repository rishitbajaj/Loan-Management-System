'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { CountBadge, EmptyState, ErrorState, PageHeader, sectionLabelClass, Surface } from '@/components/ui/Card';
import { borrowerEmailClass, borrowerNameClass, moneyPrimaryClass, moneyStrongClass } from '@/lib/ui-classes';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { borrowerOf, type Loan } from '@/lib/types';
import { useState } from 'react';

const REASON_MIN_LENGTH = 3;

function borrowerName(loan: Loan) {
  const b = borrowerOf(loan);
  return b?.profile?.fullName || b?.name || 'Borrower';
}

function borrowerEmail(loan: Loan) {
  return borrowerOf(loan)?.email ?? '—';
}

function SanctionEmptyIcon() {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function LoanActions({
  loan,
  busyId,
  onApprove,
  onReject,
}: {
  loan: Loan;
  busyId: string | null;
  onApprove: (loan: Loan) => void;
  onReject: (loan: Loan) => void;
}) {
  const isBusy = busyId === loan._id;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" loading={isBusy} onClick={() => onApprove(loan)}>
        {isBusy ? 'Approving...' : 'Approve'}
      </Button>
      <Button size="sm" variant="danger" disabled={isBusy} onClick={() => onReject(loan)}>
        Reject
      </Button>
    </div>
  );
}

export default function SanctionPage() {
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: Loan[] }>('/dashboard/sanction/loans');
  const { success, error: toastError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Loan | null>(null);
  const [reason, setReason] = useState('');

  const loans = data?.loans ?? [];
  const trimmedReason = reason.trim();
  const reasonError =
    trimmedReason.length > 0 && trimmedReason.length < REASON_MIN_LENGTH
      ? `Reason must be at least ${REASON_MIN_LENGTH} characters.`
      : undefined;

  function closeRejectModal() {
    setRejecting(null);
    setReason('');
  }

  function openRejectModal(loan: Loan) {
    setReason('');
    setRejecting(loan);
  }

  async function approve(loan: Loan) {
    setBusyId(loan._id);
    try {
      await api.patch(`/loans/${loan._id}/sanction`);
      success('Loan sanctioned successfully.');
      await refresh();
    } catch (err) {
      toastError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function reject() {
    if (!rejecting) return;
    setBusyId(rejecting._id);
    try {
      await api.patch(`/loans/${rejecting._id}/reject`, { reason });
      success('Loan rejected.');
      closeRejectModal();
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
          title="Sanction"
          description="Review applications and make lending decisions."
          actions={
            !loading && data ? (
              <CountBadge>
                {loans.length} application{loans.length === 1 ? '' : 's'} awaiting review
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
              icon={<SanctionEmptyIcon />}
              title="No applications awaiting sanction"
              description="Applications that pass the borrower journey will appear here for review."
            />
          </Surface>
        ) : (
          <>
            <Surface className="hidden md:block">
              <Table>
                <Thead>
                  <tr>
                    <Th>Borrower</Th>
                    <Th align="right">Loan amount</Th>
                    <Th>Tenure</Th>
                    <Th align="right">Interest</Th>
                    <Th align="right">Total repayment</Th>
                    <Th>Application date</Th>
                    <Th>Status</Th>
                    <Th align="right" className="w-[1%] whitespace-nowrap">
                      Actions
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
                      <Td align="right">
                        <span className={moneyStrongClass}>{formatCurrency(loan.totalRepayment)}</span>
                      </Td>
                      <Td>{formatDate(loan.createdAt)}</Td>
                      <Td>
                        <StatusBadge status={loan.status} />
                      </Td>
                      <Td align="right">
                        <LoanActions loan={loan} busyId={busyId} onApprove={approve} onReject={openRejectModal} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Surface>

            <div className="space-y-3 md:hidden">
              {loans.map((loan) => (
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
                      <dt className={sectionLabelClass}>Loan amount</dt>
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
                      <dd className={`mt-0.5 ${moneyStrongClass}`}>{formatCurrency(loan.totalRepayment)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className={sectionLabelClass}>Application date</dt>
                      <dd className="mt-0.5">{formatDate(loan.createdAt)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <LoanActions loan={loan} busyId={busyId} onApprove={approve} onReject={openRejectModal} />
                  </div>
                </Surface>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!rejecting}
        title="Reject loan application"
        description="Please provide a reason for rejecting this application."
        onClose={closeRejectModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeRejectModal}>
              Cancel
            </Button>
            <Button variant="danger" loading={!!busyId} onClick={reject} disabled={trimmedReason.length < REASON_MIN_LENGTH}>
              Reject application
            </Button>
          </>
        }
      >
        <Textarea
          id="reason"
          label="Reason"
          required
          minLength={REASON_MIN_LENGTH}
          value={reason}
          error={reasonError}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
