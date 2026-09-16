import Link from 'next/link';
import { borrowerEmailClass } from '@/lib/ui-classes';
import { borrowerOf, type Loan } from '@/lib/types';

const linkClass =
  'group inline-block rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30';

export function BorrowerApplicationLink({
  loan,
  name,
  email,
  href,
}: {
  loan: Loan;
  name: string;
  email: string;
  href: string;
}) {
  const borrower = borrowerOf(loan);

  return (
    <Link href={href} className={linkClass} aria-label={`View application for ${name}`}>
      <p className="font-semibold text-[var(--primary)] transition group-hover:text-[var(--primary-hover)] group-hover:underline">
        {name}
      </p>
      <p className={borrowerEmailClass}>{email}</p>
      <span className="mt-1 inline-block text-xs font-semibold text-[var(--primary)]">View →</span>
      {!borrower && <span className="sr-only">Application {loan._id}</span>}
    </Link>
  );
}
