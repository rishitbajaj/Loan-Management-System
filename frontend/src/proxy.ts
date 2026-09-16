import { NextResponse, type NextRequest } from 'next/server';

const ROLE_COOKIE = 'lms_role';
const TOKEN_COOKIE = 'lms_token';

const EXECUTIVE_ROLES = ['admin', 'sales', 'sanction', 'disbursement', 'collection'];

const MODULE_ROLES: Record<string, string[]> = {
  sales: ['sales', 'admin'],
  sanction: ['sanction', 'admin'],
  disbursement: ['disbursement', 'admin'],
  collection: ['collection', 'admin'],
};

function homeFor(role: string): string {
  if (role === 'borrower') return '/apply';
  if (role === 'admin') return '/dashboard';
  return `/dashboard/${role}`;
}

// UX-only navigation guard. The backend independently authenticates and authorizes every API call.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(TOKEN_COOKIE);
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isBorrowerArea = pathname.startsWith('/apply');
  const isDashboard = pathname.startsWith('/dashboard');
  const isProfile = pathname.startsWith('/profile');

  if (!hasToken || !role) {
    if (isBorrowerArea || isDashboard || isProfile) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAuthPage || pathname === '/') {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (isBorrowerArea && role !== 'borrower') {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  if (isDashboard) {
    if (!EXECUTIVE_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/apply', request.url));
    }
    const moduleKey = pathname.split('/')[2];
    if (moduleKey && MODULE_ROLES[moduleKey] && !MODULE_ROLES[moduleKey].includes(role)) {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/apply/:path*', '/dashboard/:path*', '/profile', '/profile/:path*'],
};
