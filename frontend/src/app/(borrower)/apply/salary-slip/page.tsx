'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { BorrowerPageIntro, FormActions } from '@/components/borrower/BorrowerPageIntro';
import { Alert, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, errorMessage, fetchBlob } from '@/lib/api';
import { formatBytes } from '@/lib/format';
import type { UserDetail } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

function DocumentIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function mimeLabel(mime: string) {
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'image/jpeg') return 'JPG';
  if (mime === 'image/png') return 'PNG';
  return mime.split('/').pop()?.toUpperCase() ?? 'FILE';
}

function fileTypeLabel(file: File) {
  if (file.type) return mimeLabel(file.type);
  const ext = file.name.split('.').pop();
  return ext ? ext.toUpperCase() : 'FILE';
}

export default function SalarySlipPage() {
  const { me, loading, canAccess, refresh, activeLoan } = useBorrower();
  const router = useRouter();
  const { success } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (activeLoan) router.replace('/apply/status');
    else if (!canAccess('salary-slip')) router.replace('/apply/personal-details');
  }, [loading, activeLoan, canAccess, router]);

  useEffect(() => {
    if (!me?.profile?.salarySlip) return;
    let revoked = false;
    let url: string | null = null;
    fetchBlob('/borrower/salary-slip')
      .then((blob) => {
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => undefined);
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [me?.profile?.salarySlip?.originalName, me?.profile?.salarySlip?.size]);

  function takeFile(next: File | null) {
    setFile(next);
    setError(null);
    setJustUploaded(false);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    takeFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Choose a PDF, JPG or PNG file');
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setError('Only PDF, JPG and PNG files are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File exceeds the 5 MB limit');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('file', file);
      await api.upload<{ user: UserDetail }>('/borrower/salary-slip', body);
      await refresh();
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setJustUploaded(true);
      success('Salary slip uploaded successfully.');
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      if (err instanceof ApiError && err.status === 409) router.replace('/apply/status');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !canAccess('salary-slip')) return <PageLoader />;

  const slip = me?.profile?.salarySlip;
  const isImage = slip?.mimeType.startsWith('image/');
  const showPending = !!file;
  const uploadComplete = (!!slip || justUploaded) && !showPending;
  const showUploaded = !!slip && !showPending;

  return (
    <div>
      <BorrowerPageIntro
        title="Salary slip"
        description="Upload a recent salary slip to continue. PDF, JPG or PNG · Maximum 5 MB."
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <Alert kind="error">{error}</Alert>}

          {uploadComplete && <Alert kind="success" title="Salary slip uploaded" />}

          {showPending && (
            <FilePreviewRow
              name={file.name}
              type={fileTypeLabel(file)}
              size={formatBytes(file.size)}
              onReplace={openFilePicker}
              onRemove={() => takeFile(null)}
            />
          )}

          {showUploaded && slip && !showPending && (
            <FilePreviewRow
              name={slip.originalName}
              type={mimeLabel(slip.mimeType)}
              size={formatBytes(slip.size)}
              onReplace={openFilePicker}
            />
          )}

          {!showPending && !showUploaded && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center rounded-[var(--radius-xl)] border-[1.5px] border-dashed px-6 py-12 text-center transition duration-200 ${
                dragging ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--background)]'
              }`}
            >
              <DocumentIcon className="mb-3 h-9 w-9 text-[var(--text-muted)]" />
              <p className="text-base font-semibold text-[var(--text-primary)]">Upload your salary slip</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">PDF, JPG or PNG up to 5 MB</p>
              <Button type="button" variant="secondary" size="sm" className="mt-5" onClick={openFilePicker}>
                Choose document
              </Button>
            </div>
          )}

          {showUploaded && previewUrl && (
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]">
              {isImage ? (
                <img src={previewUrl} alt="Salary slip preview" className="max-h-64 w-full object-contain" />
              ) : (
                <iframe title="Salary slip" src={previewUrl} className="h-64 w-full" />
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => takeFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />

          <p className="text-xs text-[var(--text-muted)]">The file is stored privately.</p>

          <FormActions>
            {uploadComplete ? (
              <Button type="button" className="w-full sm:w-auto" onClick={() => router.push('/apply/loan')}>
                Continue
              </Button>
            ) : (
              <Button type="submit" className="w-full sm:w-auto" loading={submitting} disabled={submitting || !file}>
                {submitting ? 'Uploading...' : 'Upload salary slip'}
              </Button>
            )}
          </FormActions>
        </form>
      </Card>
    </div>
  );
}

function FilePreviewRow({
  name,
  type,
  size,
  onReplace,
  onRemove,
}: {
  name: string;
  type: string;
  size: string;
  onReplace: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <DocumentIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{name}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {type} · {size}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onReplace}>
          Replace
        </Button>
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
