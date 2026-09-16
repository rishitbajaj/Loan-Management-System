'use client';

import { BreBadge, UploadBadge } from '@/components/StatusBadge';
import { useDashboardQuery } from '@/components/dashboard/useDashboardQuery';
import { CountBadge, EmptyState, ErrorState, MetricItem, MetricStrip, PageHeader, sectionLabelClass, Surface } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  deriveSalesLeadMetrics,
  filterSalesLeads,
  parseSalesLeadFilter,
  salesFilterEmptyMessage,
  salesLeadFilterHref,
  SALES_LEAD_FILTER_LABELS,
  type SalesLeadFilter,
} from '@/lib/sales-leads';
import { borrowerEmailClass, borrowerNameClass } from '@/lib/ui-classes';
import type { SalesLead } from '@/lib/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

function borrowerName(lead: SalesLead) {
  return lead.profile?.fullName || lead.name;
}

function SalesLeadTable({ leads }: { leads: SalesLead[] }) {
  return (
    <>
      <Surface className="hidden md:block">
        <Table>
          <Thead>
            <tr>
              <Th>Borrower</Th>
              <Th>PAN</Th>
              <Th align="right">Monthly salary</Th>
              <Th>Employment</Th>
              <Th>Eligibility</Th>
              <Th>Salary slip</Th>
              <Th>Registered</Th>
            </tr>
          </Thead>
          <Tbody>
            {leads.map((lead) => (
              <Tr key={lead._id}>
                <Td>
                  <div>
                    <p className={borrowerNameClass}>{borrowerName(lead)}</p>
                    <p className={borrowerEmailClass}>{lead.email}</p>
                  </div>
                </Td>
                <Td>{lead.profile?.pan ?? '—'}</Td>
                <Td align="right">
                  {lead.profile?.monthlySalary != null ? formatCurrency(lead.profile.monthlySalary, true) : '—'}
                </Td>
                <Td className="capitalize">{lead.profile?.employmentMode ?? '—'}</Td>
                <Td>
                  <BreBadge status={lead.profile?.breStatus ?? 'pending'} />
                </Td>
                <Td>
                  <UploadBadge uploaded={lead.hasSalarySlip} />
                </Td>
                <Td>{formatDate(lead.createdAt)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Surface>

      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <Surface key={lead._id} className="p-4">
            <div>
              <p className={borrowerNameClass}>{borrowerName(lead)}</p>
              <p className={borrowerEmailClass}>{lead.email}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className={sectionLabelClass}>PAN</dt>
                <dd className="mt-0.5">{lead.profile?.pan ?? '—'}</dd>
              </div>
              <div>
                <dt className={sectionLabelClass}>Monthly salary</dt>
                <dd className="mt-0.5 tabular-nums">
                  {lead.profile?.monthlySalary != null ? formatCurrency(lead.profile.monthlySalary, true) : '—'}
                </dd>
              </div>
              <div>
                <dt className={sectionLabelClass}>Employment</dt>
                <dd className="mt-0.5 capitalize">{lead.profile?.employmentMode ?? '—'}</dd>
              </div>
              <div>
                <dt className={sectionLabelClass}>Registered</dt>
                <dd className="mt-0.5">{formatDate(lead.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BreBadge status={lead.profile?.breStatus ?? 'pending'} />
              <UploadBadge uploaded={lead.hasSalarySlip} />
            </div>
          </Surface>
        ))}
      </div>
    </>
  );
}

function FilterBanner({ filter, count }: { filter: SalesLeadFilter; count: number }) {
  if (filter === 'all') return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-sm text-[var(--text-secondary)]">
        Showing <span className="font-semibold text-[var(--text-primary)]">{count}</span>{' '}
        {SALES_LEAD_FILTER_LABELS[filter].toLowerCase()} record{count === 1 ? '' : 's'}
      </p>
      <Link
        href={salesLeadFilterHref('all')}
        className="text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
      >
        Clear filter
      </Link>
    </div>
  );
}

export default function SalesPage() {
  const searchParams = useSearchParams();
  const filter = parseSalesLeadFilter(searchParams.get('filter'));
  const { data, error, loading, refresh } = useDashboardQuery<{ leads: SalesLead[] }>('/dashboard/sales/leads');

  const leads = data?.leads ?? [];
  const metrics = useMemo(() => deriveSalesLeadMetrics(leads), [leads]);
  const visibleLeads = useMemo(() => filterSalesLeads(leads, filter), [leads, filter]);
  const emptyMessage = salesFilterEmptyMessage(filter);

  return (
    <div>
      <PageHeader
        title="Sales"
        description={
          filter === 'all'
            ? 'Manage and review incoming borrower leads.'
            : `Manage and review incoming borrower leads — ${SALES_LEAD_FILTER_LABELS[filter].toLowerCase()}.`
        }
        actions={
          !loading && data ? (
            <CountBadge href={salesLeadFilterHref('all')}>
              {metrics.newLeads} new lead{metrics.newLeads === 1 ? '' : 's'}
            </CountBadge>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : !leads.length ? (
        <Surface>
          <EmptyState title={emptyMessage.title} description={emptyMessage.description} />
        </Surface>
      ) : (
        <>
          <MetricStrip className="mb-5">
            <MetricItem
              label="New leads"
              value={String(metrics.newLeads)}
              href={salesLeadFilterHref('all')}
              active={filter === 'all'}
            />
            <MetricItem
              label="BRE pending"
              value={String(metrics.brePending)}
              href={salesLeadFilterHref('bre-pending')}
              active={filter === 'bre-pending'}
            />
            <MetricItem
              label="Documents pending"
              value={String(metrics.documentsPending)}
              href={salesLeadFilterHref('documents-pending')}
              active={filter === 'documents-pending'}
            />
          </MetricStrip>

          <FilterBanner filter={filter} count={visibleLeads.length} />

          {!visibleLeads.length ? (
            <Surface>
              <EmptyState title={emptyMessage.title} description={emptyMessage.description} />
            </Surface>
          ) : (
            <SalesLeadTable leads={visibleLeads} />
          )}
        </>
      )}
    </div>
  );
}
