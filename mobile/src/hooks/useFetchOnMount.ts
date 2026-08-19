import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../api/reservations';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Loads data on mount and exposes a refetch (pull-to-refresh) helper.
 * Shared by every read-only CMS-backed screen (About, Gallery, Contact, ...).
 */
export function useFetchOnMount<T>(fetcher: () => Promise<T>): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefetch: boolean) => {
      if (isRefetch) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const result = await fetcher();
        setData(result);
      } catch (err) {
        setError(
          err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetcher],
  );

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, refreshing, error, refetch: () => load(true) };
}
