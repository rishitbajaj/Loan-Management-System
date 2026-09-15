'use client';

import { AppHeader } from '@/components/AppHeader';
import { BorrowerProvider } from '@/components/borrower/BorrowerContext';
import { Stepper } from '@/components/borrower/Stepper';
import { RequireRole } from '@/components/RequireRole';
import type { ReactNode } from 'react';

export default function BorrowerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={['borrower']}>
      <BorrowerProvider>
        <div className="flex flex-1 flex-col">
          <AppHeader subtitle="Borrower portal" />
          <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
            <Stepper />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </BorrowerProvider>
    </RequireRole>
  );
}
