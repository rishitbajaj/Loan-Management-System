'use client';

import { LoanList } from '@/components/dashboard/LoanList';
import { ModuleFrame, useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Loan } from '@/lib/types';
import { useState } from 'react';

export default function DisbursementPage() {
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: Loan[] }>('/dashboard/disbursement/loans');
  const { success, error: toastError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function disburse(loan: Loan) {
    setBusyId(loan._id);
    try {
      const { message } = await api.patch(`/loans/${loan._id}/disburse`);
      success(message ?? 'Loan disbursed');
      await refresh();
    } catch (err) {
      toastError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ModuleFrame title="Disbursement queue" description="Sanctioned loans ready for fund release." loading={loading} error={error}>
      <LoanList
        loans={data?.loans ?? []}
        extraColumns={[{ key: 'repay', header: 'Repayment', hideOnMobile: true, render: (loan) => formatCurrency(loan.totalRepayment) }]}
        actions={(loan) => (
          <Button size="sm" loading={busyId === loan._id} onClick={() => disburse(loan)}>
            Mark disbursed
          </Button>
        )}
      />
    </ModuleFrame>
  );
}
