'use client';

import { Topbar } from '@/components/Topbar';
import { BorrowerProvider } from '@/components/borrower/BorrowerContext';
import { Stepper } from '@/components/borrower/Stepper';
import { RequireRole } from '@/components/RequireRole';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function BorrowerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const compactLoanPage = pathname.startsWith('/apply/loan');

  return (
    <RequireRole roles={['borrower']}>
      <BorrowerProvider>
        <div className="flex min-h-screen flex-1 flex-col bg-[var(--background)]">
          <Topbar variant="borrower" />
          <div
            className={`mx-auto w-full flex-1 overflow-x-hidden px-4 sm:px-6 ${
              compactLoanPage ? 'max-w-[70rem] py-4' : 'max-w-[52rem] py-6 lg:py-8'
            }`}
          >
            <Stepper />
            {children}
          </div>
        </div>
      </BorrowerProvider>
    </RequireRole>
  );
}
