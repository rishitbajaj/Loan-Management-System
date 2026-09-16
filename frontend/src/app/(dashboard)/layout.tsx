'use client';

import { useState, type ReactNode } from 'react';
import { Topbar } from '@/components/Topbar';
import { RequireRole } from '@/components/RequireRole';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={['admin', 'sales', 'sanction', 'disbursement', 'collection']}>
      <DashboardShell>{children}</DashboardShell>
    </RequireRole>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <Sidebar />
      </aside>

      <div className="lg:pl-[var(--sidebar-width)]">
        <Topbar variant="dashboard" onMenu={() => setMenuOpen(true)} />

        {menuOpen && (
          <>
            <div
              className="animate-overlay fixed inset-0 z-50 bg-[rgba(15,23,42,0.35)] lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div className="animate-panel fixed inset-y-0 left-0 z-[60] flex w-[280px] max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] lg:hidden">
              <div className="flex justify-end px-4 pt-4">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--background)]"
                  aria-label="Close menu"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </div>
          </>
        )}

        <main className="mx-auto w-full max-w-[var(--content-max-width)] overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
