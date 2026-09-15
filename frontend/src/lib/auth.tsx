'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, TOKEN_KEY, USER_KEY } from './api';
import type { AuthUser, Role } from './types';

export const ROLE_COOKIE = 'lms_role';
export const TOKEN_COOKIE = 'lms_token';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token: string | null, nextUser: AuthUser | null) => {
    if (token && nextUser) {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      writeCookie(TOKEN_COOKIE, '1', 60 * 60 * 24);
      writeCookie(ROLE_COOKIE, nextUser.role, 60 * 60 * 24);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      clearCookie(TOKEN_COOKIE);
      clearCookie(ROLE_COOKIE);
    }
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
    router.replace('/login');
  }, [persist, router]);

  const login = useCallback((token: string, nextUser: AuthUser) => persist(token, nextUser), [persist]);

  const refresh = useCallback(async () => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      persist(null, null);
      return;
    }
    try {
      const { data } = await api.get<{ user: { _id: string; name: string; email: string; role: Role } }>('/auth/me');
      persist(token, { id: data.user._id, name: data.user.name, email: data.user.email, role: data.user.role });
    } catch {
      persist(null, null);
    }
  }, [persist]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      persist(null, null);
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [persist, router]);

  useEffect(() => {
    const stored = readStoredUser();
    if (stored) setUser(stored);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
