'use client';

import { ErrorState, PageHeader } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage, isAbortError, peekCachedGet } from '@/lib/api';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

export function useDashboardQuery<T>(path: string) {
  const cached = peekCachedGet<T>(path);
  const [data, setData] = useState<T | null>(cached?.data ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      const res = await api.get<T>(path, { fresh: true, signal });
      if (signal?.aborted) return;
      setData(res.data);
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      setError(errorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    const hit = peekCachedGet<T>(path);
    if (hit) {
      setData(hit.data);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [path, refresh]);

  return { data, error, loading, refresh: () => refresh() };
}

export function ModuleFrame({
  title,
  description,
  loading,
  error,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      )}
      {loading ? <PageLoader /> : children}
    </div>
  );
}
