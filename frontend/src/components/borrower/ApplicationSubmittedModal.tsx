'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BORROWER_STATUS_LABELS } from '@/lib/borrower-application';
import type { Loan } from '@/lib/types';

interface ApplicationSubmittedModalProps {
  open: boolean;
  loan: Loan | null;
  onContinue: () => void;
}

export function ApplicationSubmittedModal({ open, loan, onContinue }: ApplicationSubmittedModalProps) {
  if (!loan) return null;

  return (
    <Modal
      open={open}
      title="Application submitted"
      description="Your loan application has been submitted successfully."
      onClose={onContinue}
      footer={<Button onClick={onContinue}>View application status</Button>}
    >
      <div className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--success)]/20 bg-[var(--success-bg)] px-4 py-3">
          <p className="text-sm font-semibold text-emerald-900">✓ Application received</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">
            Your application will now follow the standard lending review workflow.
          </p>
        </div>

        <dl className="text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Current status</dt>
            <dd className="mt-0.5 font-semibold text-[var(--text-primary)]">{BORROWER_STATUS_LABELS[loan.status]}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
