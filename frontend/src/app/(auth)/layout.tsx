import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Surface } from '@/components/ui/Card';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center overflow-x-hidden px-4 pb-16 pt-10 sm:pt-14">
      <div className="mb-8">
        <BrandLogo href="/" height={28} />
      </div>
      <Surface className="w-full max-w-md p-6 sm:p-8">{children}</Surface>
    </main>
  );
}
