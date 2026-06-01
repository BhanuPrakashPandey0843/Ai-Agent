// src/hooks/useFavorites.js — Local favorites management
import { useState, useEffect, useCallback } from 'react';
import { getFavorites, addFavorite, removeFavorite } from '../storage';

export default function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);

  const toggle = useCallback(async (id) => {
    const current = await getFavorites();
    if (current.includes(id)) {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((f) => f !== id));
    } else {
      await addFavorite(id);
      setFavorites((prev) => [...prev, id]);
    }
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
