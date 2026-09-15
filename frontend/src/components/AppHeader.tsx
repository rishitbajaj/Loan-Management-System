'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={user ? homeFor(user.role) : '/'} className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-indigo-700">LMS</span>
          {subtitle && <span className="hidden text-sm text-slate-500 sm:inline">{subtitle}</span>}
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
