import { useEffect, useState } from 'react';
import { isOnline as checkOnline, getQueuedSubmissions } from './offline.utils';

export interface UseOfflineState {
  isOnline: boolean;
  isLoading: boolean;
  queuedCount: number;
}

/**
 * Hook to track online/offline status and queued submissions
 */
export function useOfflineStatus(): UseOfflineState {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Initialize
    setIsOnline(checkOnline());
    loadQueuedCount();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnline = () => {
    setIsOnline(true);
    loadQueuedCount();
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  const loadQueuedCount = async () => {
    setIsLoading(true);
    const queued = await getQueuedSubmissions();
    setQueuedCount(queued.length);
    setIsLoading(false);
  };

  return { isOnline, isLoading, queuedCount };
}

/**
 * Hook to fetch data with offline fallback
 */
import { fetchWithOfflineFallback, type OfflineResponse } from './offline.utils';

export function useFetchOffline<T>(
  url: string,
  options?: RequestInit & { cacheKey?: string }
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Extract cacheKey to use in dependency array
  const cacheKey = options?.cacheKey || url;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const result = await fetchWithOfflineFallback<T>(url, options);

      if (isMounted) {
        if (result.data) {
          setData(result.data);
          setIsCached(result.isCached);
          setIsOffline(result.isOffline);
          setError(null);
        } else if (!result.isCached && result.isOffline) {
          setError(new Error('No data available offline'));
          setIsOffline(true);
        }
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [url, cacheKey]); // Only depend on url and cacheKey

  return { data, error, isLoading, isCached, isOffline };
}
