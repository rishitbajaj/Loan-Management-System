'use client';

import { BrandLogo } from '@/components/BrandLogo';
import { UserAccountMenu } from '@/components/UserAccountMenu';
import { useAuth } from '@/lib/auth';
import { getTopbarContext } from '@/lib/topbar-context';
import { homeFor } from '@/lib/rbac';
import { usePathname } from 'next/navigation';

export type TopbarVariant = 'dashboard' | 'borrower';

interface TopbarProps {
  variant?: TopbarVariant;
  context?: string;
  onMenu?: () => void;
}

function TopbarDivider({ className = '' }: { className?: string }) {
  return <span className={`h-7 w-px shrink-0 bg-[var(--border)] ${className}`} aria-hidden />;
}

function ContextTitle({ children, borrower = false }: { children: string; borrower?: boolean }) {
  return (
    <p
      className={`truncate leading-none ${
        borrower
          ? 'text-[17px] font-semibold text-[var(--text-primary)] sm:text-lg'
          : 'text-sm font-semibold text-[var(--text-secondary)] sm:text-[15px]'
      }`}
    >
      {children}
    </p>
  );
}

export function Topbar({ variant = 'dashboard', context, onMenu }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = context ?? getTopbarContext(pathname);
  const home = user ? homeFor(user.role) : '/';
  const isBorrower = variant === 'borrower';

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className="mx-auto flex h-[var(--topbar-height)] w-full min-w-0 max-w-[var(--content-max-width)] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="topbar-left flex min-w-0 flex-1 items-center gap-4">
          {onMenu && (
            <button
              type="button"
              onClick={onMenu}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30 lg:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {isBorrower ? (
            <>
              <BrandLogo href={home} height={32} className="shrink-0" />
              <TopbarDivider className="hidden sm:block" />
              <ContextTitle borrower>{title}</ContextTitle>
            </>
          ) : (
            <ContextTitle>{title}</ContextTitle>
          )}
        </div>

        <div className="topbar-right flex shrink-0 items-center">{user && <UserAccountMenu />}</div>
      </div>
    </header>
  );
}
