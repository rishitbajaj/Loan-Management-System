'use client';

import { LoanList } from '@/components/dashboard/LoanList';
import { ModuleFrame, useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatCurrency, todayInputValue } from '@/lib/format';
import { borrowerOf, type Loan, type Payment } from '@/lib/types';
import { useState } from 'react';

export default function CollectionPage() {
  const { data, error, loading, refresh } = useDashboardQuery<{ loans: Loan[] }>('/dashboard/collection/loans');
  const { success, error: toastError } = useToast();
  const [target, setTarget] = useState<Loan | null>(null);
  const [form, setForm] = useState({ utr: '', amount: '', paidOn: todayInputValue() });
  const [fieldError, setFieldError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Payment[] | null>(null);

  function openPay(loan: Loan) {
    setHistory(null);
    setTarget(loan);
    setFieldError(null);
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

  async function submitPayment() {
    if (!target) return;
    setBusy(true);
    setFieldError(null);
    try {
      const { message } = await api.post(`/loans/${target._id}/payments`, {
        utr: form.utr,
        amount: Number(form.amount),
        paidOn: form.paidOn,
      });
      success(message ?? 'Payment recorded');
      setTarget(null);
      setHistory(null);
      await refresh();
    } catch (err) {
      const parsed = err instanceof ApiError ? err : new ApiError(0, errorMessage(err));
      setFieldError(parsed);
      toastError(parsed.message);
    } finally {
      setBusy(false);
    }
  }

  const paying = target && history === null;

  return (
    <>
      <ModuleFrame title="Collection" description="Record repayments on disbursed loans. A loan auto-closes when outstanding reaches zero." loading={loading} error={error}>
        <LoanList
          loans={data?.loans ?? []}
          extraColumns={[
            { key: 'paid', header: 'Paid', render: (loan) => formatCurrency(loan.totalPaid) },
            { key: 'out', header: 'Outstanding', render: (loan) => formatCurrency(loan.outstanding) },
          ]}
          actions={(loan) => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => openHistory(loan)}>
                History
              </Button>
              {loan.status === 'disbursed' && (
                <Button size="sm" onClick={() => openPay(loan)}>
                  Record payment
                </Button>
              )}
            </div>
          )}
        />
      </ModuleFrame>

      <Modal
        open={!!paying}
        title="Record payment"
        description={target ? `${borrowerOf(target)?.name ?? 'Borrower'} · outstanding ${formatCurrency(target.outstanding)}` : undefined}
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={submitPayment}>
              Save payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="utr" label="UTR number" required value={form.utr} onChange={(e) => setForm((f) => ({ ...f, utr: e.target.value.toUpperCase() }))} error={fieldError?.fieldMessage('utr')} />
          <Input
            id="amount"
            label="Amount"
            type="number"
            min={0.01}
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            error={fieldError?.fieldMessage('amount')}
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
      </Modal>

      <Modal
        open={!!history && !!target}
        title="Payment history"
        description={target ? borrowerOf(target)?.name : undefined}
        onClose={() => {
          setHistory(null);
          setTarget(null);
        }}
      >
        {history && history.length === 0 && <p className="text-sm text-slate-500">No payments yet.</p>}
        {history && history.length > 0 && (
          <ul className="divide-y divide-slate-100 text-sm">
            {history.map((p) => (
              <li key={p._id} className="flex justify-between py-2">
                <span>
                  {p.utr}
                  <span className="block text-xs text-slate-500">{p.paidOn.slice(0, 10)}</span>
                </span>
                <span className="font-medium">{formatCurrency(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
