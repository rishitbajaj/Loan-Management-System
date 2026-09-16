export function getTopbarContext(pathname: string): string {
  if (pathname.startsWith('/profile')) return 'My profile';
  if (pathname === '/dashboard') return 'Overview';
  if (pathname.startsWith('/dashboard/sales')) return 'Sales';
  if (pathname.startsWith('/dashboard/sanction')) return 'Sanction';
  if (pathname.startsWith('/dashboard/disbursement')) return 'Disbursement';
  if (pathname.startsWith('/dashboard/collection')) return 'Collection';
  if (pathname.startsWith('/dashboard/active-loans')) return 'Active Loans';
  if (pathname.startsWith('/apply')) return 'Borrower Portal';
  return 'Dashboard';
}
