import type { Role } from './types';

export interface DashboardModule {
  key: 'sales' | 'sanction' | 'disbursement' | 'collection';
  label: string;
  href: string;
  description: string;
  roles: Role[];
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  { key: 'sales', label: 'Sales', href: '/dashboard/sales', description: 'Registered borrowers who have not applied yet', roles: ['sales', 'admin'] },
  { key: 'sanction', label: 'Sanction', href: '/dashboard/sanction', description: 'Review applied loans', roles: ['sanction', 'admin'] },
  { key: 'disbursement', label: 'Disbursement', href: '/dashboard/disbursement', description: 'Release funds for sanctioned loans', roles: ['disbursement', 'admin'] },
  { key: 'collection', label: 'Collection', href: '/dashboard/collection', description: 'Record repayments on disbursed loans', roles: ['collection', 'admin'] },
];

export const EXECUTIVE_ROLES: Role[] = ['admin', 'sales', 'sanction', 'disbursement', 'collection'];

export function isExecutive(role: Role): boolean {
  return EXECUTIVE_ROLES.includes(role);
}

export function modulesForRole(role: Role): DashboardModule[] {
  return DASHBOARD_MODULES.filter((m) => m.roles.includes(role));
}

export function canAccessModule(role: Role, key: DashboardModule['key']): boolean {
  return DASHBOARD_MODULES.some((m) => m.key === key && m.roles.includes(role));
}

export function homeFor(role: Role): string {
  if (role === 'borrower') return '/apply';
  if (role === 'admin') return '/dashboard';
  return modulesForRole(role)[0]?.href ?? '/dashboard';
}

export function formatRoleLabel(role: Role): string {
  if (role === 'admin') return 'Admin';
  if (role === 'borrower') return 'Borrower';
  return role.charAt(0).toUpperCase() + role.slice(1);
}
