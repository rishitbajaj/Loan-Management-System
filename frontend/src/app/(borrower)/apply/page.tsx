'use client';

import { useBorrower } from '@/components/borrower/BorrowerContext';
import { PageLoader } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ApplyIndexPage() {
  const { loading, nextStep } = useBorrower();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(`/apply/${nextStep}`);
  }, [loading, nextStep, router]);

  return <PageLoader />;
}
