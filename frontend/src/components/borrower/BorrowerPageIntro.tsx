import type { ReactNode } from 'react';

export function BorrowerPageIntro({
  title,
  description,
  actions,
  compact = false,
  dense = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
  dense?: boolean;
}) {
  const marginClass = dense ? 'mb-4' : compact ? 'mb-3 lg:mb-4' : 'mb-5';

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${marginClass}`}>
      <div>
        <h1
          className={`font-bold leading-tight tracking-[-0.025em] text-[var(--text-primary)] ${
            dense ? 'text-[32px]' : compact ? 'text-2xl sm:text-[28px]' : 'text-[32px]'
          }`}
        >
          {title}
        </h1>
        {description && (
          <p
            className={`max-w-xl text-[var(--text-muted)] ${
              dense
                ? 'mt-1 text-sm leading-snug'
                : compact
                  ? 'mt-1 text-xs leading-snug sm:text-sm'
                  : 'mt-2 text-sm leading-relaxed'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function FormActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end ${className}`}>{children}</div>;
}
