'use client';

import { api, errorMessage, isAbortError, peekCachedGet } from '@/lib/api';
import { requiresIncomeProof } from '@/lib/employment-labels';
import type { Loan, UserDetail } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type BorrowerStep = 'personal-details' | 'salary-slip' | 'loan' | 'status';

interface BorrowerState {
  me: UserDetail | null;
  loans: Loan[];
  activeLoan: Loan | null;
  latestLoan: Loan | null;
  loading: boolean;
  error: string | null;
  refresh: (opts?: { fresh?: boolean }) => Promise<void>;
  nextStep: BorrowerStep;
  canAccess: (step: BorrowerStep) => boolean;
}

const BorrowerContext = createContext<BorrowerState | null>(null);

const ACTIVE = new Set(['applied', 'sanctioned', 'disbursed']);

export function BorrowerProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cachedMe = peekCachedGet<{ user: UserDetail }>('/auth/me');
  const cachedLoans = peekCachedGet<{ loans: Loan[] }>('/loans/me');
  const [me, setMe] = useState<UserDetail | null>(cachedMe?.data.user ?? null);
  const [loans, setLoans] = useState<Loan[]>(cachedLoans?.data.loans ?? []);
  const [loading, setLoading] = useState(!(cachedMe && cachedLoans));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { fresh?: boolean; signal?: AbortSignal }) => {
    try {
      const cachedMe = !opts?.fresh ? peekCachedGet<{ user: UserDetail }>('/auth/me') : null;
      const [meRes, loansRes] = await Promise.all([
        cachedMe
          ? Promise.resolve(cachedMe)
          : api.get<{ user: UserDetail }>('/auth/me', { fresh: opts?.fresh, signal: opts?.signal }),
        api.get<{ loans: Loan[] }>('/loans/me', { fresh: true, signal: opts?.signal }),
      ]);
      if (opts?.signal?.aborted) return;
      setMe(meRes.data.user);
      setLoans(loansRes.data.loans);
      setError(null);
    } catch (err) {
      if (isAbortError(err) || opts?.signal?.aborted) return;
      setError(errorMessage(err));
    } finally {
      if (!opts?.signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const hasMe = !!peekCachedGet<{ user: UserDetail }>('/auth/me');
    const hasLoans = !!peekCachedGet<{ loans: Loan[] }>('/loans/me');
    if (hasMe && hasLoans) setLoading(false);
    void refresh({ fresh: false, signal: controller.signal });
    return () => controller.abort();
  }, [refresh, pathname]);

  const value = useMemo<BorrowerState>(() => {
    const activeLoan = loans.find((l) => ACTIVE.has(l.status)) ?? null;
    const latestLoan = loans[0] ?? null;
    const brePassed = me?.profile?.breStatus === 'passed';
    const hasSlip = !!me?.profile?.salarySlip;
    const needsIncomeProof = requiresIncomeProof(me?.profile?.employmentMode);
    const incomeProofComplete = !needsIncomeProof || hasSlip;

    const nextStep: BorrowerStep = activeLoan
      ? 'status'
      : !brePassed
        ? 'personal-details'
        : needsIncomeProof && !hasSlip
          ? 'salary-slip'
          : 'loan';

    const canAccess = (step: BorrowerStep): boolean => {
      switch (step) {
        case 'personal-details':
          return !activeLoan;
        case 'salary-slip':
          return !activeLoan && brePassed && needsIncomeProof;
        case 'loan':
          return !activeLoan && brePassed && incomeProofComplete;
        case 'status':
          return loans.length > 0;
      }
    };

    return { me, loans, activeLoan, latestLoan, loading, error, refresh, nextStep, canAccess };
  }, [me, loans, loading, error, refresh]);

  return <BorrowerContext.Provider value={value}>{children}</BorrowerContext.Provider>;
}

export function useBorrower(): BorrowerState {
  const ctx = useContext(BorrowerContext);
  if (!ctx) throw new Error('useBorrower must be used within BorrowerProvider');
  return ctx;
}
