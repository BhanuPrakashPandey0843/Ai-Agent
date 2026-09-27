// src/hooks/useFavorites.js — Local favorites management
import { useState, useEffect, useCallback } from 'react';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  subscribeToStoredList,
} from '../storage';
import { STORAGE_KEYS } from '../constants';

export default function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    let mounted = true;
    // Initial read — what is on disk right now (survives app restarts).
    getFavorites().then((ids) => {
      if (mounted) setFavorites(ids || []);
    });
    // Live updates — an add/remove from any other copy of this hook (wallpaper
    // grid, wallpaper detail, favorites screen) republishes the new list here,
    // so screens that stay mounted (e.g. the Settings stat cards) never show a
    // stale count.
    const unsubscribe = subscribeToStoredList(STORAGE_KEYS.FAVORITES, (ids) => {
      if (mounted) setFavorites(ids || []);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const toggle = useCallback(async (id) => {
    // No optimistic local write: the storage helpers publish the resulting
    // list, which updates this hook and every other consumer from one source
    // of truth, so the two can never drift apart.
    const current = await getFavorites();
    if (current.includes(id)) {
      await removeFavorite(id);
    } else {
      await addFavorite(id);
    }
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
