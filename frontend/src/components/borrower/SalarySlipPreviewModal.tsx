'use client';

import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Card';
import { errorMessage, fetchBlob } from '@/lib/api';
import { formatBytes } from '@/lib/format';
import type { SalarySlipMeta } from '@/lib/types';
import { useEffect, useState } from 'react';

interface SalarySlipPreviewModalProps {
  slip: SalarySlipMeta;
  open: boolean;
  onClose: () => void;
}

export function SalarySlipPreviewModal({ slip, open, onClose }: SalarySlipPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let revoked = false;
    let url: string | null = null;

    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    fetchBlob('/borrower/salary-slip')
      .then((blob) => {
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch((err) => {
        if (!revoked) setError(errorMessage(err));
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, slip.originalName, slip.uploadedAt]);

  const isImage = slip.mimeType.startsWith('image/');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Salary slip"
      description={slip.originalName}
      footer={
        previewUrl ? (
          <a
            href={previewUrl}
            download={slip.originalName}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--background)]"
          >
            Download
          </a>
        ) : undefined
      }
    >
      {loading && <PageLoader />}
      {error && <Alert kind="error">{error}</Alert>}
      {!loading && !error && previewUrl && (
        <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)]">
          {isImage ? (
            <img src={previewUrl} alt={slip.originalName} className="max-h-[min(70vh,560px)] w-full object-contain" />
          ) : (
            <iframe title={slip.originalName} src={previewUrl} className="h-[min(70vh,560px)] w-full" />
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {formatBytes(slip.size)} · Stored securely on the server
      </p>
    </Modal>
  );
}

interface SalarySlipDocumentRowProps {
  slip: SalarySlipMeta;
}

export function SalarySlipDocumentRow({ slip }: SalarySlipDocumentRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--border)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{slip.originalName}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{formatBytes(slip.size)} · Click to view</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-[var(--primary)]">View →</span>
      </button>
      <SalarySlipPreviewModal slip={slip} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
