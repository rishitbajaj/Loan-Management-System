export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="space-y-5 py-2">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-4 h-8 w-20" />
            <SkeletonBlock className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-sm)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-[var(--border-light)] px-4 py-4 last:border-b-0">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingState() {
  return <PageLoader />;
}
