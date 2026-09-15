import { formatDateTime } from '@/lib/format';
import type { StatusHistoryEntry } from '@/lib/types';

export function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (!history.length) return <p className="text-sm text-slate-500">No status history yet.</p>;

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {history.map((entry, index) => (
        <li key={`${entry.to}-${entry.at}-${index}`} className="relative">
          <span className="absolute -left-[1.4375rem] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
          <p className="text-sm font-medium capitalize text-slate-900">
            {entry.from ? `${entry.from} -> ${entry.to}` : entry.to}
          </p>
          {entry.note && <p className="text-sm text-slate-600">{entry.note}</p>}
          <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
        </li>
      ))}
    </ol>
  );
}
