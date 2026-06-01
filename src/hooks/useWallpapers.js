import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWallpapers, getFirestoreErrorMessage } from '../services/firebaseService';

/**
 * Loads wallpapers via one-time Firestore fetch (no realtime listeners).
 */
export default function useWallpapers(category = null) {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const lastDocRef = useRef(null);

  const load = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          lastDocRef.current = null;
          setError(null);
        }
        const { items, lastVisible, hasMore: more } = await fetchWallpapers(
          category,
          reset ? null : lastDocRef.current
        );
        lastDocRef.current = lastVisible;
        setWallpapers((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(more);
        setError(null);
      } catch (err) {
        setError(getFirestoreErrorMessage(err));
        if (reset) setWallpapers([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [category]
  );

  useEffect(() => {
    setLoading(true);
    lastDocRef.current = null;
    load(true);
  }, [category, load]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      load(false);
    }
  }, [loadingMore, hasMore, load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    load(true);
  }, [load]);

  return {
    wallpapers,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadMore,
    refresh,
    retry,
  };
}
