'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { Alert, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError, errorMessage, fetchBlob } from '@/lib/api';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { UserDetail } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

export default function SalarySlipPage() {
  const { me, loading, canAccess, refresh, activeLoan } = useBorrower();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      success('Salary slip uploaded');
      router.push('/apply/loan');
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toastError(message);
      if (err instanceof ApiError && err.status === 409) router.replace('/apply/status');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !canAccess('salary-slip')) return <PageLoader />;

  const slip = me?.profile?.salarySlip;
  const isImage = slip?.mimeType.startsWith('image/');

  return (
    <Card title="Upload salary slip" description="PDF, JPG or PNG. Maximum 5 MB. The file is stored privately and served only through an authenticated endpoint.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        {slip && (
          <Alert kind="success">
            Current file: {slip.originalName} ({formatBytes(slip.size)}) uploaded {formatDateTime(slip.uploadedAt)}
          </Alert>
        )}
        {previewUrl && (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {isImage ? (
              <img src={previewUrl} alt="Salary slip preview" className="max-h-80 w-full bg-slate-100 object-contain" />
            ) : (
              <iframe title="Salary slip" src={previewUrl} className="h-80 w-full" />
            )}
          </div>
        )}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700">
            Salary slip
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {slip && (
            <Button type="button" variant="secondary" onClick={() => router.push('/apply/loan')}>
              Continue
            </Button>
          )}
          <Button type="submit" loading={submitting}>
            {slip ? 'Replace and continue' : 'Upload'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
