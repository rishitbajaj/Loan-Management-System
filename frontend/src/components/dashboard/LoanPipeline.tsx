'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import type { LoanStatus } from '@/lib/types';
import { Fragment } from 'react';

type PipelineStatus = Exclude<LoanStatus, 'rejected'>;

const PIPELINE_STAGES: {
  status: PipelineStatus;
  hint: string;
  href?: string;
}[] = [
  { status: 'applied', hint: 'Awaiting sanction', href: '/dashboard/sanction' },
  { status: 'sanctioned', hint: 'Awaiting disbursement', href: '/dashboard/disbursement' },
  { status: 'disbursed', hint: 'In collection', href: '/dashboard/collection' },
  { status: 'closed', hint: 'Fully repaid' },
];

const stageCardClass =
  'flex h-full min-h-[150px] flex-col rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] p-5';

const stageCardInteractiveClass =
  'cursor-pointer transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-[var(--border)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30';

export function LoanPipeline({ loansByStatus }: { loansByStatus: Record<LoanStatus, number> }) {
  return (
    <section aria-labelledby="loan-pipeline-heading">
      <div className="border-b border-[var(--border-light)] px-6 py-6">
        <h2 id="loan-pipeline-heading" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Loan pipeline
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Track loans across the lending lifecycle.</p>
      </div>

      <div className="hidden items-stretch px-6 py-6 lg:flex">
        {PIPELINE_STAGES.map((stage, index) => (
          <Fragment key={stage.status}>
            <div className="min-w-0 max-w-[240px] flex-1">
              <PipelineStageCard status={stage.status} count={loansByStatus[stage.status]} hint={stage.hint} href={stage.href} />
            </div>
            {index < PIPELINE_STAGES.length - 1 && <PipelineConnector />}
          </Fragment>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 py-6 lg:hidden">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineStageCard
            key={stage.status}
            status={stage.status}
            count={loansByStatus[stage.status]}
            hint={stage.hint}
            href={stage.href}
          />
        ))}
      </div>
    </section>
  );
}

function PipelineStageCard({
  status,
  count,
  hint,
  href,
}: {
  status: PipelineStatus;
  count: number;
  hint: string;
  href?: string;
}) {
  const body = (
    <>
      <StatusBadge status={status} />
      <p className="mt-3 text-[36px] font-bold leading-none tabular-nums tracking-[-0.03em] text-[#111827]">{count}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase leading-snug tracking-[0.06em] text-[var(--text-muted)]">{hint}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${stageCardClass} ${stageCardInteractiveClass}`} aria-label={`${status}: ${count} loans, ${hint}`}>
        {body}
      </Link>
    );
  }

  return (
    <div className={stageCardClass} aria-label={`${status}: ${count} loans, ${hint}`}>
      {body}
    </div>
  );
}

function PipelineConnector() {
  return (
    <div className="flex min-w-4 max-w-12 flex-1 items-center self-center px-1" aria-hidden>
      <div className="relative flex w-full items-center">
        <span className="h-px w-full bg-[#CBD5E1]" />
        <span className="absolute right-0 top-1/2 size-0 -translate-y-1/2 border-y-[3px] border-l-[5px] border-y-transparent border-l-[#94A3B8]" />
      </div>
    </div>
  );
}
