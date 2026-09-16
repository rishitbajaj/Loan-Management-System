'use client';

import { ErrorState, PageHeader } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { api, errorMessage } from '@/lib/api';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

export function useDashboardQuery<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<T>(path);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, loading, refresh };
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
