'use client';

import { LoanList } from '@/components/dashboard/LoanList';
import { ModuleFrame, useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Loan } from '@/lib/types';
import { useState } from 'react';

export default function SanctionPage() {
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: Loan[] }>('/dashboard/sanction/loans');
  const { success, error: toastError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Loan | null>(null);
  const [reason, setReason] = useState('');

  async function approve(loan: Loan) {
    setBusyId(loan._id);
    try {
      const { message } = await api.patch(`/loans/${loan._id}/sanction`);
      success(message ?? 'Loan sanctioned');
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
      const { message } = await api.patch(`/loans/${rejecting._id}/reject`, { reason });
      success(message ?? 'Loan rejected');
      setRejecting(null);
      setReason('');
      await refresh();
    } catch (err) {
      toastError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ModuleFrame title="Sanction queue" description="Applied loans waiting for approval or rejection." loading={loading} error={error}>
        <LoanList
          loans={data?.loans ?? []}
          extraColumns={[{ key: 'repay', header: 'Repayment', hideOnMobile: true, render: (loan) => formatCurrency(loan.totalRepayment) }]}
          actions={(loan) => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" loading={busyId === loan._id} onClick={() => approve(loan)}>
                Approve
              </Button>
              <Button size="sm" variant="danger" disabled={busyId === loan._id} onClick={() => setRejecting(loan)}>
                Reject
              </Button>
            </div>
          )}
        />
      </ModuleFrame>

      <Modal
        open={!!rejecting}
        title="Reject loan"
        description="The borrower will see this reason on their status page."
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={!!busyId} onClick={reject} disabled={reason.trim().length < 3}>
              Reject
            </Button>
          </>
        }
      >
        <Textarea id="reason" label="Reason" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </>
  );
}
