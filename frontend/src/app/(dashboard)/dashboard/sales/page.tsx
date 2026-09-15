'use client';

import { BreBadge } from '@/components/StatusBadge';
import { ModuleFrame, useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { EmptyState } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/format';
import type { SalesLead } from '@/lib/types';

export default function SalesPage() {
  const { data, error, loading } = useDashboardQuery<{ leads: SalesLead[] }>('/dashboard/sales/leads');
  const leads = data?.leads ?? [];

  return (
    <ModuleFrame title="Sales leads" description="Borrowers who have registered but have never created a loan." loading={loading} error={error}>
      {!leads.length ? (
        <EmptyState title="No leads" description="Once borrowers register, they appear here until they apply." />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Borrower</th>
                  <th className="px-3 py-2 font-medium">PAN</th>
                  <th className="px-3 py-2 font-medium">Salary</th>
                  <th className="px-3 py-2 font-medium">BRE</th>
                  <th className="px-3 py-2 font-medium">Slip</th>
                  <th className="px-3 py-2 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="px-3 py-3">
                      <p className="font-medium">{lead.profile?.fullName || lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.email}</p>
                    </td>
                    <td className="px-3 py-3">{lead.profile?.pan ?? '-'}</td>
                    <td className="px-3 py-3">{lead.profile?.monthlySalary != null ? formatCurrency(lead.profile.monthlySalary, true) : '-'}</td>
                    <td className="px-3 py-3">
                      <BreBadge status={lead.profile?.breStatus ?? 'pending'} />
                    </td>
                    <td className="px-3 py-3">{lead.hasSalarySlip ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-3">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {leads.map((lead) => (
              <article key={lead._id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium">{lead.profile?.fullName || lead.name}</p>
                <p className="text-xs text-slate-500">{lead.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <BreBadge status={lead.profile?.breStatus ?? 'pending'} />
                  <span>{lead.hasSalarySlip ? 'Slip uploaded' : 'No slip'}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </ModuleFrame>
  );
}
