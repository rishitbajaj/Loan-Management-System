'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';
import type { Role } from '@/lib/types';

// Client-side UX guard; API authorization is enforced by the backend.
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!allowed) router.replace(homeFor(user.role));
  }, [loading, user, allowed, router]);

  if (!user) return <PageLoader />;
  if (!allowed) return <PageLoader />;
  return <>{children}</>;
}
