'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { Alert, Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Payment } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StatusPage() {
  const { loading, canAccess, latestLoan, refresh } = useBorrower();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!canAccess('status')) router.replace('/apply/personal-details');
  }, [loading, canAccess, router]);

  useEffect(() => {
    if (!latestLoan || (latestLoan.status !== 'disbursed' && latestLoan.status !== 'closed')) {
      setPayments([]);
      return;
    }
    let cancelled = false;
    api
      .get<{ payments: Payment[] }>(`/loans/${latestLoan._id}/payments`)
      .then(({ data }) => {
        if (!cancelled) setPayments(data.payments);
      })
      .catch((err) => {
        if (!cancelled) setPayError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [latestLoan?._id, latestLoan?.status, latestLoan?.totalPaid]);

  if (loading) return <PageLoader />;
  if (!latestLoan) return <EmptyState title="No loan yet" description="Complete the application to see your status here." />;

  const canReapply = latestLoan.status === 'rejected' || latestLoan.status === 'closed';

  return (
    <div className="space-y-4">
      <Card
        title="Application status"
        description="applied is the pending application state. Executives move the loan through sanction, disbursement and collection."
        actions={<StatusBadge status={latestLoan.status} />}
      >
        {latestLoan.status === 'rejected' && latestLoan.rejectionReason && (
          <Alert kind="error" title="Rejected">
            {latestLoan.rejectionReason}
          </Alert>
        )}
        {latestLoan.status === 'closed' && <Alert kind="success">This loan is fully repaid and closed.</Alert>}

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Principal</dt>
            <dd className="font-medium">{formatCurrency(latestLoan.principal)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tenure</dt>
            <dd className="font-medium">{latestLoan.tenureDays} days</dd>
          </div>
          <div>
            <dt className="text-slate-500">Interest</dt>
            <dd className="font-medium">{formatCurrency(latestLoan.interest)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total repayment</dt>
            <dd className="font-medium">{formatCurrency(latestLoan.totalRepayment)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Paid</dt>
            <dd className="font-medium">{formatCurrency(latestLoan.totalPaid)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Outstanding</dt>
            <dd className="font-medium">{formatCurrency(latestLoan.outstanding)}</dd>
          </div>
        </dl>

        {canReapply && (
          <div className="mt-4">
            <Button
              onClick={async () => {
                await refresh();
                router.push('/apply/loan');
              }}
            >
              Apply again
            </Button>
          </div>
        )}
      </Card>

      <Card title="Timeline">
        <StatusTimeline history={latestLoan.statusHistory} />
      </Card>

      {(latestLoan.status === 'disbursed' || latestLoan.status === 'closed') && (
        <Card title="Payments">
          {payError && <Alert kind="error">{payError}</Alert>}
          {payments.length === 0 && !payError ? (
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {payments.map((p) => (
                <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{p.utr}</p>
                    <p className="text-slate-500">{formatDate(p.paidOn)}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(p.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
