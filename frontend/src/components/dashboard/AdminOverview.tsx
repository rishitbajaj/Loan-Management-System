'use client';

import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Card';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { DashboardSummary, LoanStatus } from '@/lib/types';
import { useEffect, useState } from 'react';

const LABELS: Record<LoanStatus, string> = {
  applied: 'Applied',
  sanctioned: 'Sanctioned',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  closed: 'Closed',
};

export function AdminOverview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardSummary>('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <Alert kind="error">{error}</Alert>;
  if (!summary) return <PageLoader />;

  const tiles = [
    { label: 'Borrowers', value: String(summary.totalBorrowers) },
    { label: 'Sales leads', value: String(summary.leads) },
    { label: 'Loans', value: String(summary.totalLoans) },
    { label: 'Disbursed principal', value: formatCurrency(summary.disbursedPrincipal) },
    { label: 'Outstanding', value: formatCurrency(summary.outstanding) },
  ];

  return (
    <div className="space-y-4">
      <Card title="Overview" description="Admin can open every operations module from the sidebar.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{t.value}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Loans by status">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(LABELS) as LoanStatus[]).map((status) => (
            <div key={status} className="rounded-lg border border-slate-100 px-3 py-3 text-center">
              <p className="text-2xl font-semibold text-slate-900">{summary.loansByStatus[status]}</p>
              <p className="text-xs capitalize text-slate-500">{LABELS[status]}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
