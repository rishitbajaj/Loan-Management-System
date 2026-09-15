'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/lib/auth';
import { modulesForRole } from '@/lib/rbac';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={['admin', 'sales', 'sanction', 'disbursement', 'collection']}>
      <DashboardShell>{children}</DashboardShell>
    </RequireRole>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const modules = user ? modulesForRole(user.role) : [];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader subtitle="Operations dashboard" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="lg:w-56">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {user?.role === 'admin' && (
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                Overview
              </NavLink>
            )}
            {modules.map((m) => (
              <NavLink key={m.key} href={m.href} active={pathname.startsWith(m.href)}>
                {m.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
        active ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}
