'use client';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/api';
import type { Loan } from '@/lib/types';
import { useState } from 'react';

const REASON_MIN_LENGTH = 3;

export function SanctionLoanActions({
  loan,
  onComplete,
  layout = 'row',
}: {
  loan: Loan;
  onComplete: () => void | Promise<void>;
  layout?: 'row' | 'stack';
}) {
  const { success, error: toastError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const trimmedReason = reason.trim();
  const reasonError =
    trimmedReason.length > 0 && trimmedReason.length < REASON_MIN_LENGTH
      ? `Reason must be at least ${REASON_MIN_LENGTH} characters.`
      : undefined;

  if (loan.status !== 'applied') return null;

  const isBusy = busyId === loan._id;
  const buttonClass = layout === 'stack' ? 'w-full' : '';

  function closeRejectModal() {
    setRejecting(false);
    setReason('');
  }

  async function approve() {
    setBusyId(loan._id);
    try {
      await api.patch(`/loans/${loan._id}/sanction`);
      success('Loan sanctioned successfully.');
      await onComplete();
    } catch (err) {
      toastError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function reject() {
    setBusyId(loan._id);
    try {
      await api.patch(`/loans/${loan._id}/reject`, { reason });
      success('Loan rejected.');
      closeRejectModal();
      await onComplete();
    } catch (err) {
      toastError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className={layout === 'stack' ? 'flex flex-col gap-2' : 'flex flex-wrap justify-end gap-2'}>
        <Button size="sm" className={buttonClass} loading={isBusy} onClick={approve}>
          {isBusy && !rejecting ? 'Approving...' : 'Approve'}
        </Button>
        <Button size="sm" variant="danger" className={buttonClass} disabled={isBusy} onClick={() => setRejecting(true)}>
          Reject
        </Button>
      </div>

      <Modal
        open={rejecting}
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
