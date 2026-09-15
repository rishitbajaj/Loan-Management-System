'use client';

import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/format';
import { borrowerOf, type Loan } from '@/lib/types';
import type { ReactNode } from 'react';

interface Column {
  key: string;
  header: string;
  hideOnMobile?: boolean;
  render: (loan: Loan) => ReactNode;
}

export function LoanList({
  loans,
  extraColumns = [],
  actions,
}: {
  loans: Loan[];
  extraColumns?: Column[];
  actions?: (loan: Loan) => ReactNode;
}) {
  if (!loans.length) return <EmptyState title="Nothing in this queue" />;

  const columns: Column[] = [
    {
      key: 'borrower',
      header: 'Borrower',
      render: (loan) => {
        const b = borrowerOf(loan);
        return (
          <div>
            <p className="font-medium text-slate-900">{b?.profile?.fullName || b?.name || 'Borrower'}</p>
            <p className="text-xs text-slate-500">{b?.email}</p>
          </div>
        );
      },
    },
    { key: 'principal', header: 'Principal', render: (loan) => formatCurrency(loan.principal) },
    { key: 'tenure', header: 'Tenure', hideOnMobile: true, render: (loan) => `${loan.tenureDays}d` },
    { key: 'status', header: 'Status', render: (loan) => <StatusBadge status={loan.status} /> },
    { key: 'updated', header: 'Updated', hideOnMobile: true, render: (loan) => formatDate(loan.updatedAt) },
    ...extraColumns,
  ];

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium">
                  {c.header}
                </th>
              ))}
              {actions && <th className="px-3 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((loan) => (
              <tr key={loan._id} className="align-top">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-3">
                    {c.render(loan)}
                  </td>
                ))}
                {actions && <td className="px-3 py-3">{actions(loan)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loans.map((loan) => {
          const b = borrowerOf(loan);
          return (
            <article key={loan._id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{b?.profile?.fullName || b?.name || 'Borrower'}</p>
                  <p className="text-xs text-slate-500">{b?.email}</p>
                </div>
                <StatusBadge status={loan.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-500">Principal</dt>
                  <dd>{formatCurrency(loan.principal)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tenure</dt>
                  <dd>{loan.tenureDays} days</dd>
                </div>
                {extraColumns.map((c) => (
                  <div key={c.key}>
                    <dt className="text-slate-500">{c.header}</dt>
                    <dd>{c.render(loan)}</dd>
                  </div>
                ))}
              </dl>
              {actions && <div className="mt-3 flex flex-wrap gap-2">{actions(loan)}</div>}
            </article>
          );
        })}
      </div>
    </>
  );
}
