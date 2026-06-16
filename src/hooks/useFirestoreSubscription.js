import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestoreErrorMessage } from '../services/firebaseService';
import { cacheLibraryItems, getCachedLibraryItems } from '../storage';

/**
 * Realtime Firestore subscription with optional AsyncStorage cache fallback.
 */
export default function useFirestoreSubscription(subscribeFn, cacheKey = null) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const applyItems = useCallback(
    async (nextItems, live = true) => {
      if (!mountedRef.current) return;
      // Ensure we always set an array, even if nextItems is undefined/null or not an array
      const safeItems = Array.isArray(nextItems) ? nextItems : [];
      setItems(safeItems);
      setLoading(false);
      setError(null);
      setFromCache(!live);
      if (live && cacheKey) {
        await cacheLibraryItems(cacheKey, safeItems);
      }
    },
    [cacheKey]
  );

  const loadCache = useCallback(async () => {
    if (!cacheKey) return null;
    return getCachedLibraryItems(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    let unsub = null;
    setLoading(true);

    const start = async () => {
      unsub = subscribeFn(
        (data) => {
          applyItems(data, true);
          setRefreshing(false);
        },
        async (err) => {
          const cached = await loadCache();
          if (cached?.length) {
            await applyItems(cached, false);
          } else {
            if (!mountedRef.current) return;
            setError(getFirestoreErrorMessage(err));
            setLoading(false);
          }
          setRefreshing(false);
        }
      );
    };

    start();

    return () => {
      mountedRef.current = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [subscribeFn, applyItems, loadCache, retryCount]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setFromCache(false);
    setRetryCount((c) => c + 1);
  }, []);

  return {
    items,
    loading,
    error,
    refreshing,
    fromCache,
    refresh,
    retry,
  };
}
