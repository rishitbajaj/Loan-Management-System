'use client';

import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Card';
import { errorMessage, fetchBlob } from '@/lib/api';
import { formatBytes } from '@/lib/format';
import type { SalarySlipMeta } from '@/lib/types';
import { useEffect, useState } from 'react';

const DEFAULT_ENDPOINT = '/borrower/salary-slip';

function useSalarySlipUrl(endpoint: string, enabled: boolean, slip: SalarySlipMeta) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let revoked = false;
    let url: string | null = null;

    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    fetchBlob(endpoint)
      .then((blob) => {
        if (revoked) return;
        const typed = new Blob([blob], { type: slip.mimeType || blob.type || 'application/pdf' });
        url = URL.createObjectURL(typed);
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
  }, [enabled, endpoint, slip.originalName, slip.uploadedAt]);

  return { previewUrl, loading, error };
}

function SalarySlipFrame({
  slip,
  previewUrl,
  heightClass,
}: {
  slip: SalarySlipMeta;
  previewUrl: string;
  heightClass: string;
}) {
  const isImage = slip.mimeType.startsWith('image/');

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)]">
      {isImage ? (
        <img src={previewUrl} alt={slip.originalName} className="max-h-[min(70vh,640px)] w-full object-contain" />
      ) : (
        <iframe title={slip.originalName} src={previewUrl} className={`${heightClass} w-full`} />
      )}
    </div>
  );
}

function DownloadLink({ href, fileName }: { href: string; fileName: string }) {
  return (
    <a
      href={href}
      download={fileName}
      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--background)]"
    >
      Download
    </a>
  );
}

interface SalarySlipPreviewModalProps {
  slip: SalarySlipMeta;
  open: boolean;
  onClose: () => void;
  endpoint?: string;
}

export function SalarySlipPreviewModal({
  slip,
  open,
  onClose,
  endpoint = DEFAULT_ENDPOINT,
}: SalarySlipPreviewModalProps) {
  const { previewUrl, loading, error } = useSalarySlipUrl(endpoint, open, slip);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Income proof"
      description={slip.originalName}
      size="lg"
      footer={previewUrl ? <DownloadLink href={previewUrl} fileName={slip.originalName} /> : undefined}
    >
      {loading && <PageLoader />}
      {error && <Alert kind="error">{error}</Alert>}
      {!loading && !error && previewUrl && (
        <div className="mt-4">
          <SalarySlipFrame slip={slip} previewUrl={previewUrl} heightClass="h-[min(70vh,560px)] max-h-[min(70vh,560px)]" />
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {formatBytes(slip.size)} · Stored securely on the server
      </p>
    </Modal>
  );
}

export function SalarySlipInlinePreview({
  slip,
  endpoint,
}: {
  slip: SalarySlipMeta;
  endpoint: string;
}) {
  const { previewUrl, loading, error } = useSalarySlipUrl(endpoint, true, slip);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{slip.originalName}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {formatBytes(slip.size)} · Uploaded for this application
          </p>
        </div>
        {previewUrl && <DownloadLink href={previewUrl} fileName={slip.originalName} />}
      </div>
      {loading && <PageLoader />}
      {error && <Alert kind="error">{error}</Alert>}
      {!loading && !error && previewUrl && (
        <SalarySlipFrame slip={slip} previewUrl={previewUrl} heightClass="h-[min(70vh,640px)] max-h-[min(70vh,640px)]" />
      )}
    </div>
  );
}

interface SalarySlipDocumentRowProps {
  slip: SalarySlipMeta;
  endpoint?: string;
}

export function SalarySlipDocumentRow({ slip, endpoint = DEFAULT_ENDPOINT }: SalarySlipDocumentRowProps) {
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
      <SalarySlipPreviewModal slip={slip} endpoint={endpoint} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
