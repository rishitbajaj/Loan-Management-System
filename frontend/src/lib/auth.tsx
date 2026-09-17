'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { api, clearApiCache, isAbortError, setUnauthorizedHandler, TOKEN_KEY, USER_KEY } from './api';
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

const authListeners = new Set<() => void>();

function emitAuth(): void {
  authListeners.forEach((listener) => listener());
}

function subscribeAuth(onStoreChange: () => void): () => void {
  authListeners.add(onStoreChange);
  return () => authListeners.delete(onStoreChange);
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function getAuthSnapshot(): AuthUser | null {
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function getAuthServerSnapshot(): AuthUser | null {
  return null;
}

function writeSession(token: string | null, nextUser: AuthUser | null): void {
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
    clearApiCache();
  }
  emitAuth();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const [sessionChecked, setSessionChecked] = useState(false);

  const persist = useCallback((token: string | null, nextUser: AuthUser | null) => {
    writeSession(token, nextUser);
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
    router.replace('/login');
  }, [persist, router]);

  const login = useCallback((token: string, nextUser: AuthUser) => persist(token, nextUser), [persist]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      persist(null, null);
      return;
    }
    try {
      const { data } = await api.get<{ user: { _id: string; name: string; email: string; role: Role } }>('/auth/me', {
        signal,
      });
      if (signal?.aborted) return;
      persist(token, { id: data.user._id, name: data.user.name, email: data.user.email, role: data.user.role });
    } catch (err) {
      if (isAbortError(err)) return;
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
    const controller = new AbortController();
    void refresh(controller.signal).finally(() => {
      if (!controller.signal.aborted) setSessionChecked(true);
    });
    return () => controller.abort();
  }, [refresh]);

  const loading = !user && !sessionChecked;
  const refreshPublic = useCallback(async () => {
    await refresh();
  }, [refresh]);
  const value = useMemo(
    () => ({ user, loading, login, logout, refresh: refreshPublic }),
    [user, loading, login, logout, refreshPublic],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
