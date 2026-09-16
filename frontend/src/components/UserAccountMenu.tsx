'use client';

import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/lib/auth';
import { formatRoleLabel } from '@/lib/rbac';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 2.5H3.5A1 1 0 0 0 2.5 3.5v9a1 1 0 0 0 1 1H6M10.5 11.5 13 9M13 9l-2.5-2.5M13 9H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm font-medium leading-none text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30 ${className}`}
    >
      <LogoutIcon />
      Logout
    </button>
  );
}

export function UserAccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  if (!user) return null;

  const roleLabel = formatRoleLabel(user.role);

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <div ref={menuRef} className="relative flex items-center">
      <div className="hidden items-center md:flex">
        <Link
          href="/profile"
          className="inline-flex min-w-0 items-center rounded-[var(--radius-md)] pr-2 transition-colors hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
          aria-label="My profile"
        >
          <UserAvatar name={user.name} />
          <div className="ml-3 min-w-0 max-w-[11rem] lg:max-w-[13rem]">
            <p className="truncate text-sm font-semibold leading-[18px] text-[var(--text-primary)]">{user.name}</p>
            <p className="truncate text-xs leading-[16px] text-[var(--text-muted)]">{roleLabel}</p>
          </div>
        </Link>
        <LogoutButton onClick={handleLogout} className="ml-5 shrink-0 lg:ml-6" />
      </div>

      <button
        type="button"
        className="inline-flex items-center rounded-full md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Account menu"
      >
        <UserAvatar name={user.name} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-md)] md:hidden"
        >
          <div className="border-b border-[var(--border-light)] px-3 py-2.5">
            <p className="truncate text-sm font-semibold leading-[18px] text-[var(--text-primary)]">{user.name}</p>
            <p className="truncate text-xs leading-[16px] text-[var(--text-muted)]">{roleLabel}</p>
          </div>
          <div className="pt-1">
            <Link
              href="/profile"
              role="menuitem"
              className="flex w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
              onClick={() => setOpen(false)}
            >
              My profile
            </Link>
            <LogoutButton onClick={handleLogout} className="w-full justify-start" />
          </div>
        </div>
      )}
    </div>
  );
}
