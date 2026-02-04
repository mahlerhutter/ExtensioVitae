/**
 * Optimized Query Hooks
 *
 * Custom hooks for data fetching with caching, deduplication, and retry logic.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for cached data fetching
 */
export function useCachedQuery(key, fetcher, options = {}) {
  const {
    enabled = true,
    staleTime = CACHE_DURATION,
    retry = 2,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(() => {
    const cached = cache.get(key);
    return cached?.data || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const isMounted = useRef(true);
  const retryCount = useRef(0);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache
    const cached = cache.get(key);
    if (!force && cached) {
      const age = Date.now() - cached.timestamp;
      if (age < staleTime) {
        setData(cached.data);
        setIsStale(false);
        return;
      }
      // Data is stale but we have it
      setData(cached.data);
      setIsStale(true);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();

      if (isMounted.current) {
        setData(result);
        setIsLoading(false);
        setIsStale(false);

        // Update cache
        cache.set(key, {
          data: result,
          timestamp: Date.now()
        });

        onSuccess?.(result);
      }
    } catch (err) {
      if (isMounted.current) {
        // Retry logic
        if (retryCount.current < retry) {
          retryCount.current++;
          setTimeout(() => fetchData(), retryDelay * retryCount.current);
          return;
        }

        setError(err);
        setIsLoading(false);
        onError?.(err);
      }
    }
  }, [key, fetcher, enabled, staleTime, retry, retryDelay, onSuccess, onError]);

  useEffect(() => {
    isMounted.current = true;
    retryCount.current = 0;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    retryCount.current = 0;
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticMutation(mutationFn, options = {}) {
  const {
    onMutate,
    onSuccess,
    onError,
    onSettled,
    invalidateKeys = []
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (variables) => {
    setIsLoading(true);
    setError(null);

    // Optimistic update callback
    const previousData = onMutate?.(variables);

    try {
      const result = await mutationFn(variables);

      // Invalidate related cache keys
      invalidateKeys.forEach(key => cache.delete(key));

      onSuccess?.(result, variables);
      return result;
    } catch (err) {
      setError(err);

      // Rollback optimistic update
      if (previousData !== undefined) {
        // Restore previous state (caller should handle this)
      }

      onError?.(err, variables);
      throw err;
    } finally {
      setIsLoading(false);
      onSettled?.();
    }
  }, [mutationFn, onMutate, onSuccess, onError, onSettled, invalidateKeys]);

  return {
    mutate,
    isLoading,
    error
  };
}

/**
 * Hook for debounced values
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle(callback, delay = 300) {
  const lastCall = useRef(0);
  const lastArgs = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    lastArgs.current = args;

    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]);
}

/**
 * Clear all cached data
 */
export function clearCache() {
  cache.clear();
}

/**
 * Clear specific cache key
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Prefetch data into cache
 */
export async function prefetch(key, fetcher) {
  try {
    const data = await fetcher();
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  } catch (error) {
    console.error('Prefetch error:', error);
    return null;
  }
}

export default {
  useCachedQuery,
  useOptimisticMutation,
  useDebounce,
  useThrottle,
  clearCache,
  invalidateCache,
  prefetch
};
