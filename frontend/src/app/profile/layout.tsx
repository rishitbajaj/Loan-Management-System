'use client';

import { Topbar } from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth';
import { isExecutive } from '@/lib/rbac';
import { ROLES } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!ROLES.includes(user.role)) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return <PageLoader />;

  if (isExecutive(user.role)) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--surface)] lg:block">
          <Sidebar />
        </aside>

        <div className="lg:pl-[var(--sidebar-width)]">
          <Topbar variant="dashboard" context="My profile" onMenu={() => setMenuOpen(true)} />

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

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[var(--background)]">
      <Topbar variant="borrower" context="My profile" />
      <main className="mx-auto w-full max-w-[52rem] flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
