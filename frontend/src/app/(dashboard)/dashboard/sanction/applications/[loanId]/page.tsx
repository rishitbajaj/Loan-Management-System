'use client';

import { ApplicationDetailView } from '@/components/dashboard/ApplicationDetailView';
import { ErrorState } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage, isAbortError, peekCachedGet } from '@/lib/api';
import type { Loan } from '@/lib/types';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function SanctionApplicationDetailPage() {
  const params = useParams<{ loanId: string }>();
  const loanId = params.loanId;
  const cached = loanId ? peekCachedGet<{ loan: Loan }>(`/loans/${loanId}`) : null;

  const [loan, setLoan] = useState<Loan | null>(cached?.data.loan ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { fresh?: boolean; signal?: AbortSignal }) => {
      if (!loanId) return;
      setError(null);
      try {
        const { data } = await api.get<{ loan: Loan }>(`/loans/${loanId}`, { fresh: opts?.fresh, signal: opts?.signal });
        if (opts?.signal?.aborted) return;
        setLoan(data.loan);
      } catch (err) {
        if (isAbortError(err) || opts?.signal?.aborted) return;
        setError(errorMessage(err));
      } finally {
        if (!opts?.signal?.aborted) setLoading(false);
      }
    },
    [loanId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  async function refresh() {
    await load({ fresh: true });
  }

  if (loading && !loan) return <PageLoader />;

  if (error || !loan) {
    return (
      <div className="space-y-4">
        <ErrorState message={error ?? 'Application not found'} onRetry={refresh} />
      </div>
    );
  }

  return (
    <ApplicationDetailView
      loan={loan}
      backHref="/dashboard/sanction"
      backLabel="Back to Sanction"
      onRefresh={refresh}
    />
  );
}
