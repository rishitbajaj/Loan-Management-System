'use client';

import { ApplicationDetailView } from '@/components/dashboard/ApplicationDetailView';
import { ErrorState } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage } from '@/lib/api';
import type { Loan } from '@/lib/types';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function SanctionApplicationDetailPage() {
  const params = useParams<{ loanId: string }>();
  const loanId = params.loanId;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!loanId) return;
    setError(null);
    try {
      const { data } = await api.get<{ loan: Loan }>(`/loans/${loanId}`);
      setLoan(data.loan);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setLoading(true);
    await load();
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
