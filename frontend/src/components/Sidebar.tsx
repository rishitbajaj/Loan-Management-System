'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/lib/auth';
import { modulesForRole } from '@/lib/rbac';

type NavIcon = 'overview' | 'sales' | 'sanction' | 'disbursement' | 'collection';

const ICONS: Record<NavIcon, ReactNode> = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  sales: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  sanction: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 4.5h10M4 9h7M4 13.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13.5 8.5l1.5 1.5-3 3-1.5-1.5 3-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  disbursement: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8h13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  collection: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 6v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const modules = user ? modulesForRole(user.role) : [];
  const home = user ? (user.role === 'admin' ? '/dashboard' : modules[0]?.href ?? '/dashboard') : '/';

  return (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="mb-6 px-2">
        <BrandLogo href={home} height={28} onClick={onNavigate} />
      </div>

      <nav className="flex flex-1 flex-col">
        <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Operations</p>
        <ul className="space-y-1">
          {user?.role === 'admin' && (
            <li>
              <NavLink href="/dashboard" active={pathname === '/dashboard'} icon="overview" onNavigate={onNavigate}>
                Overview
              </NavLink>
            </li>
          )}
          {modules.map((m) => (
            <li key={m.key}>
              <NavLink href={m.href} active={pathname.startsWith(m.href)} icon={m.key} onNavigate={onNavigate}>
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: NavIcon;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative flex items-center gap-3 rounded-[var(--radius-md)] py-2.5 pl-4 pr-3.5 text-sm transition-colors duration-200 ${
        active
          ? 'bg-[var(--primary-light)] font-semibold text-[var(--primary)]'
          : 'font-medium text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]'
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[var(--primary)]" aria-hidden />}
      <span className={`shrink-0 ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{ICONS[icon]}</span>
      {children}
    </Link>
  );
}
