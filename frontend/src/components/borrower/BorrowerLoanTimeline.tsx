import { getLoanJourneyTimeline, type JourneyStageState } from '@/lib/borrower-application';
import { formatDateTime } from '@/lib/format';
import type { Loan } from '@/lib/types';

export function BorrowerLoanTimeline({ loan }: { loan: Loan }) {
  const stages = getLoanJourneyTimeline(loan);

  return (
    <ol className="space-y-0" aria-label="Application journey">
      {stages.map((stage, index) => (
        <TimelineItem
          key={stage.id}
          label={stage.label}
          description={stage.description}
          date={stage.timestamp}
          state={stage.state}
          last={index === stages.length - 1}
        />
      ))}
    </ol>
  );
}

function TimelineItem({
  label,
  description,
  date,
  state,
  last = false,
}: {
  label: string;
  description?: string;
  date?: string;
  state: JourneyStageState;
  last?: boolean;
}) {
  const marker =
    state === 'completed' ? (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        ✓
      </span>
    ) : state === 'current' ? (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] text-white" aria-hidden>
        ●
      </span>
    ) : state === 'error' ? (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
        ✕
      </span>
    ) : (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[11px] text-[var(--text-muted)]">
        ○
      </span>
    );

  const labelClass =
    state === 'current'
      ? 'font-semibold text-[var(--primary)]'
      : state === 'completed'
        ? 'font-medium text-[var(--text-primary)]'
        : state === 'error'
          ? 'font-medium text-red-800'
          : 'text-[var(--text-muted)]';

  return (
    <li className="relative pl-8 pb-6 last:pb-0">
      <span className="absolute left-0 top-0">{marker}</span>
      {!last && <span className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-[var(--border-light)]" aria-hidden />}
      <div className="min-w-0">
        <p className={`text-sm ${labelClass}`}>
          {label}
          {state === 'current' && <span className="sr-only"> (current stage)</span>}
        </p>
        {description && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>}
        {date && <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(date)}</p>}
      </div>
    </li>
  );
}
