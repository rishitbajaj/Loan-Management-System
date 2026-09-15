'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Loan, UserDetail } from '@/lib/types';

export type BorrowerStep = 'personal-details' | 'salary-slip' | 'loan' | 'status';

interface BorrowerState {
  me: UserDetail | null;
  loans: Loan[];
  activeLoan: Loan | null;
  latestLoan: Loan | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  nextStep: BorrowerStep;
  canAccess: (step: BorrowerStep) => boolean;
}

const BorrowerContext = createContext<BorrowerState | null>(null);

const ACTIVE = new Set(['applied', 'sanctioned', 'disbursed']);

export function BorrowerProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<UserDetail | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [meRes, loansRes] = await Promise.all([api.get<{ user: UserDetail }>('/auth/me'), api.get<{ loans: Loan[] }>('/loans/me')]);
      setMe(meRes.data.user);
      setLoans(loansRes.data.loans);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<BorrowerState>(() => {
    const activeLoan = loans.find((l) => ACTIVE.has(l.status)) ?? null;
    const latestLoan = loans[0] ?? null;
    const brePassed = me?.profile?.breStatus === 'passed';
    const hasSlip = !!me?.profile?.salarySlip;

    const nextStep: BorrowerStep = activeLoan ? 'status' : !brePassed ? 'personal-details' : !hasSlip ? 'salary-slip' : 'loan';

    const canAccess = (step: BorrowerStep): boolean => {
      switch (step) {
        case 'personal-details':
          return !activeLoan;
        case 'salary-slip':
          return !activeLoan && brePassed;
        case 'loan':
          return !activeLoan && brePassed && hasSlip;
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
