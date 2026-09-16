import type { SalesLead } from './types';

/** Reusable sales drill-down filter keys — shared by KPI counts and table filtering. */
export type SalesLeadFilter = 'all' | 'bre-pending' | 'documents-pending';

export const SALES_LEAD_FILTER_LABELS: Record<SalesLeadFilter, string> = {
  all: 'New leads',
  'bre-pending': 'BRE pending',
  'documents-pending': 'Documents pending',
};

export function parseSalesLeadFilter(value: string | null): SalesLeadFilter {
  if (value === 'bre-pending' || value === 'documents-pending') return value;
  return 'all';
}

export function salesLeadFilterHref(filter: SalesLeadFilter): string {
  if (filter === 'all') return '/dashboard/sales';
  return `/dashboard/sales?filter=${filter}`;
}

export function isBrePendingLead(lead: SalesLead): boolean {
  return (lead.profile?.breStatus ?? 'pending') === 'pending';
}

export function isDocumentsPendingLead(lead: SalesLead): boolean {
  return !lead.hasSalarySlip;
}

export function deriveSalesLeadMetrics(leads: SalesLead[]) {
  return {
    newLeads: leads.length,
    brePending: leads.filter(isBrePendingLead).length,
    documentsPending: leads.filter(isDocumentsPendingLead).length,
  };
}

export function filterSalesLeads(leads: SalesLead[], filter: SalesLeadFilter): SalesLead[] {
  switch (filter) {
    case 'bre-pending':
      return leads.filter(isBrePendingLead);
    case 'documents-pending':
      return leads.filter(isDocumentsPendingLead);
    default:
      return leads;
  }
}

export function salesFilterEmptyMessage(filter: SalesLeadFilter): { title: string; description: string } {
  switch (filter) {
    case 'bre-pending':
      return {
        title: 'No BRE pending leads',
        description: 'All leads in this view have completed eligibility checks.',
      };
    case 'documents-pending':
      return {
        title: 'No document pending leads',
        description: 'All leads in this view have uploaded income proof.',
      };
    default:
      return {
        title: 'No new leads',
        description: 'All registered borrowers have either started or completed an application.',
      };
  }
}
