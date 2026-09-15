'use client';

import { useAuth } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/Spinner';
import { AdminOverview } from '@/components/dashboard/AdminOverview';

export default function DashboardIndexPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') router.replace(homeFor(user.role));
  }, [user, router]);

  if (!user) return <PageLoader />;
  if (user.role !== 'admin') return <PageLoader />;
  return <AdminOverview />;
}
