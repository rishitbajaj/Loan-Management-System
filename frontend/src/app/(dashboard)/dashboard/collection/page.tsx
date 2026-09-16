'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { Alert, CountBadge, EmptyState, ErrorState, MetricItem, MetricStrip, ModalSummaryBox, PageHeader, sectionLabelClass, Surface } from '@/components/ui/Card';
import { borrowerEmailClass, borrowerNameClass, moneyStrongClass } from '@/lib/ui-classes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate, todayInputValue } from '@/lib/format';
import { borrowerOf, type Loan, type Payment } from '@/lib/types';
import { useMemo, useState } from 'react';

function borrowerName(loan: Loan) {
  const b = borrowerOf(loan);
  return b?.profile?.fullName || b?.name || 'Borrower';
}

function borrowerEmail(loan: Loan) {
  return borrowerOf(loan)?.email ?? '—';
}

function OutstandingCell({ loan }: { loan: Loan }) {
  if (loan.outstanding <= 0) {
    return <span className="tabular-nums text-[var(--text-muted)]">{formatCurrency(0)}</span>;
  }
  return <span className="text-base font-bold tabular-nums text-[var(--primary)]">{formatCurrency(loan.outstanding)}</span>;
}

function CollectionEmptyIcon() {
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
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function LoanActions({
  loan,
  onPay,
  onHistory,
}: {
  loan: Loan;
  onPay: (loan: Loan) => void;
  onHistory: (loan: Loan) => void;
}) {
  if (loan.status === 'disbursed') {
    return (
      <Button size="sm" onClick={() => onPay(loan)}>
        Record payment
      </Button>
    );
  }
  return (
    <Button size="sm" variant="secondary" onClick={() => onHistory(loan)}>
      History
    </Button>
  );
}

export default function CollectionPage() {
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: Loan[] }>('/dashboard/collection/loans');
  const { success, error: toastError } = useToast();
  const [target, setTarget] = useState<Loan | null>(null);
  const [form, setForm] = useState({ utr: '', amount: '', paidOn: todayInputValue() });
  const [fieldError, setFieldError] = useState<ApiError | null>(null);
  const [localAmountError, setLocalAmountError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Payment[] | null>(null);
  const [closedNotice, setClosedNotice] = useState(false);

  const loans = data?.loans ?? [];

  const summary = useMemo(() => {
    const activeLoans = loans.filter((l) => l.status === 'disbursed').length;
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding, 0);
    const paymentsReceived = loans.reduce((sum, l) => sum + l.totalPaid, 0);
    return { activeLoans, totalOutstanding, paymentsReceived };
  }, [loans]);

  function closePayModal() {
    setTarget(null);
    setClosedNotice(false);
    setFieldError(null);
    setLocalAmountError(undefined);
  }

  function openPay(loan: Loan) {
    setHistory(null);
    setClosedNotice(false);
    setTarget(loan);
    setFieldError(null);
    setLocalAmountError(undefined);
    setForm({ utr: '', amount: String(loan.outstanding), paidOn: todayInputValue() });
  }

  async function openHistory(loan: Loan) {
    try {
      const { data: payload } = await api.get<{ payments: Payment[] }>(`/loans/${loan._id}/payments`);
      setHistory(payload.payments);
      setTarget(loan);
    } catch (err) {
      toastError(errorMessage(err));
    }
  }

  function closeHistoryModal() {
    setHistory(null);
    setTarget(null);
  }

  async function submitPayment() {
    if (!target) return;
    const amount = Number(form.amount);
    if (amount > target.outstanding) {
      setLocalAmountError(`Payment cannot exceed outstanding ${formatCurrency(target.outstanding)}`);
      return;
    }
    setBusy(true);
    setFieldError(null);
    setLocalAmountError(undefined);
    try {
      const { data: result, message } = await api.post<{ loan: Loan; payment: Payment }>(`/loans/${target._id}/payments`, {
        utr: form.utr,
        amount,
        paidOn: form.paidOn,
      });
      if (result.loan.status === 'closed') {
        setClosedNotice(true);
        success('Loan fully repaid. Status: Closed');
      } else {
        success(message ?? 'Payment recorded successfully.');
        closePayModal();
      }
      setHistory(null);
      await refresh();
    } catch (err) {
      const parsed = err instanceof ApiError ? err : new ApiError(0, errorMessage(err));
      setFieldError(parsed);
    } finally {
      setBusy(false);
    }
  }

  const paying = target && history === null;

  return (
    <>
      <div>
        <PageHeader
          title="Collection"
          description="Track repayments and manage outstanding loan balances."
          actions={
            !loading && data ? (
              <CountBadge>
                {loans.length} loan{loans.length === 1 ? '' : 's'}
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
              icon={<CollectionEmptyIcon />}
              title="No loans in collection"
              description="Disbursed loans will appear here for repayment tracking."
            />
          </Surface>
        ) : (
          <>
            <MetricStrip className="mb-4">
              <MetricItem label="Active loans" value={String(summary.activeLoans)} />
              <MetricItem label="Total outstanding" value={formatCurrency(summary.totalOutstanding)} emphasize />
              <MetricItem label="Payments received" value={formatCurrency(summary.paymentsReceived)} />
            </MetricStrip>

            <Surface className="hidden md:block">
              <Table>
                <Thead>
                  <tr>
                    <Th>Borrower</Th>
                    <Th align="right">Principal</Th>
                    <Th>Tenure</Th>
                    <Th>Status</Th>
                    <Th>Last updated</Th>
                    <Th align="right">Paid</Th>
                    <Th align="right">Outstanding</Th>
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
                      <Td align="right">{formatCurrency(loan.principal)}</Td>
                      <Td>{loan.tenureDays} days</Td>
                      <Td>
                        <StatusBadge status={loan.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-[var(--text-secondary)]">{formatDate(loan.updatedAt)}</Td>
                      <Td align="right">{formatCurrency(loan.totalPaid)}</Td>
                      <Td align="right">
                        <OutstandingCell loan={loan} />
                      </Td>
                      <Td align="right">
                        <LoanActions loan={loan} onPay={openPay} onHistory={openHistory} />
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
                      <dt className={sectionLabelClass}>Principal</dt>
                      <dd className="mt-0.5 tabular-nums">{formatCurrency(loan.principal)}</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Tenure</dt>
                      <dd className="mt-0.5">{loan.tenureDays} days</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Paid</dt>
                      <dd className="mt-0.5 tabular-nums">{formatCurrency(loan.totalPaid)}</dd>
                    </div>
                    <div>
                      <dt className={sectionLabelClass}>Outstanding</dt>
                      <dd className="mt-0.5">
                        <OutstandingCell loan={loan} />
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className={sectionLabelClass}>Last updated</dt>
                      <dd className="mt-0.5">{formatDate(loan.updatedAt)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <LoanActions loan={loan} onPay={openPay} onHistory={openHistory} />
                  </div>
                </Surface>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!paying}
        title="Record payment"
        onClose={closePayModal}
        footer={
          closedNotice ? (
            <Button onClick={closePayModal}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closePayModal}>
                Cancel
              </Button>
              <Button loading={busy} onClick={submitPayment}>
                {busy ? 'Recording...' : 'Record payment'}
              </Button>
            </>
          )
        }
      >
        {closedNotice ? (
          <div className="space-y-3">
            <Alert kind="success" title="Loan fully repaid">
              <p className="mt-1">Status: Closed</p>
            </Alert>
            <p className="text-sm text-[var(--text-secondary)]">This loan has been fully repaid and is now closed.</p>
          </div>
        ) : (
          target && (
            <div className="space-y-4">
              <ModalSummaryBox label="Outstanding" value={formatCurrency(target.outstanding)} emphasize />
              <Input
                id="utr"
                label="UTR number"
                required
                value={form.utr}
                onChange={(e) => setForm((f) => ({ ...f, utr: e.target.value.toUpperCase() }))}
                error={fieldError?.fieldMessage('utr')}
              />
              <Input
                id="amount"
                label="Amount"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => {
                  setForm((f) => ({ ...f, amount: e.target.value }));
                  setLocalAmountError(undefined);
                }}
                error={localAmountError ?? fieldError?.fieldMessage('amount')}
              />
              <Input
                id="paidOn"
                label="Payment date"
                type="date"
                required
                max={todayInputValue()}
                value={form.paidOn}
                onChange={(e) => setForm((f) => ({ ...f, paidOn: e.target.value }))}
                error={fieldError?.fieldMessage('paidOn')}
              />
            </div>
          )
        )}
      </Modal>

      <Modal
        open={!!history && !!target}
        title="Payment history"
        description={target ? borrowerName(target) : undefined}
        onClose={closeHistoryModal}
        footer={
          <Button variant="secondary" onClick={closeHistoryModal}>
            Close
          </Button>
        }
      >
        {history && history.length === 0 && (
          <EmptyState title="No payments recorded yet" description="Payments will appear here once recorded." />
        )}
        {history && history.length > 0 && (
          <ul className="divide-y divide-[var(--border-light)]">
            {history.map((p) => (
              <li key={p._id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[var(--text-muted)]">{formatDate(p.paidOn)}</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(p.amount)}</p>
                  <p className="mt-0.5 max-w-full break-all font-mono text-[12px] tracking-wide text-[var(--text-muted)]" title={p.utr}>
                    {p.utr}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
