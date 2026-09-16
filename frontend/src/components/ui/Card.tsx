import { sectionLabelClass } from '@/lib/ui-classes';
import Link from 'next/link';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export { sectionLabelClass };

export function Card({ title, description, actions, className = '', children, ...rest }: CardProps) {
  return (
    <section
      {...rest}
      className={`rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)] ${className}`}
    >
      {(title || actions) && (
        <header className="mb-5 flex flex-col gap-2 border-b border-[var(--border-light)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>}
            {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Alert({ kind, title, children }: { kind: 'error' | 'success' | 'info' | 'warning'; title?: string; children?: ReactNode }) {
  const styles = {
    error: 'border-red-200 bg-[var(--danger-bg)] text-red-900',
    success: 'border-emerald-200 bg-[var(--success-bg)] text-emerald-900',
    info: 'border-cyan-200 bg-[var(--info-bg)] text-cyan-950',
    warning: 'border-amber-200 bg-[var(--warning-bg)] text-amber-950',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm ${styles}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      {icon && <div className="mb-4 flex justify-center text-[var(--text-disabled)]">{icon}</div>}
      <p className="text-base font-semibold text-[var(--text-primary)]">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
      <p className="font-semibold text-[var(--text-primary)]">Something went wrong</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
          Try again
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.025em] text-[var(--text-primary)]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] ${className}`}>
      {children}
    </div>
  );
}

const statCardClass =
  'flex min-h-[132px] flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]';

const statCardInteractiveClass =
  'cursor-pointer transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-px hover:border-[var(--text-disabled)] hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30';

export function StatCard({
  label,
  value,
  context,
  emphasize,
  href,
}: {
  label: string;
  value: string;
  context?: string;
  emphasize?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <p className={sectionLabelClass}>{label}</p>
      <p
        className={`mt-auto pt-3 tabular-nums tracking-[-0.03em] ${emphasize ? 'text-[32px] font-bold text-[var(--primary)]' : 'text-[28px] font-bold text-[var(--text-primary)]'}`}
      >
        {value}
      </p>
      {context && <p className="mt-2 text-xs text-[var(--text-muted)]">{context}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${statCardClass} ${statCardInteractiveClass}`}>
        {body}
      </Link>
    );
  }

  return <div className={statCardClass}>{body}</div>;
}

const metricInteractiveClass =
  'cursor-pointer rounded-[var(--radius-md)] transition-[background-color,box-shadow,border-color] duration-150 ease-out hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30';

const countBadgeClass =
  'inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)]';

const countBadgeInteractiveClass =
  'cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-[var(--text-disabled)] hover:bg-[var(--surface)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30';

export function CountBadge({ children, href }: { children: ReactNode; href?: string }) {
  if (href) {
    return (
      <Link href={href} className={`${countBadgeClass} ${countBadgeInteractiveClass}`}>
        {children}
      </Link>
    );
  }

  return <span className={countBadgeClass}>{children}</span>;
}

export function MetricStrip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Surface className={`px-5 py-4 ${className}`}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </Surface>
  );
}

export function MetricItem({
  label,
  value,
  emphasize,
  href,
  active,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  href?: string;
  active?: boolean;
}) {
  const body = (
    <>
      <p className={sectionLabelClass}>{label}</p>
      <p
        className={`mt-1 tabular-nums tracking-tight ${emphasize ? 'text-xl font-bold text-[var(--primary)]' : 'text-lg font-semibold text-[var(--text-primary)]'}`}
      >
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? 'true' : undefined}
        className={`${metricInteractiveClass} block p-2 -m-2 ${active ? 'bg-[var(--background)] ring-1 ring-[var(--border)]' : ''}`}
      >
        {body}
      </Link>
    );
  }

  return <div>{body}</div>;
}

export function ModalSummaryBox({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-4 py-4">
      <p className={sectionLabelClass}>{label}</p>
      <p className={`mt-2 text-[28px] font-bold tabular-nums leading-none tracking-[-0.03em] ${emphasize ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
    </div>
  );
}

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${sectionLabelClass} ${className}`}>{children}</p>;
}
