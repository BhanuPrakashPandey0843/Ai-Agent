// src/storage/index.js — Typed AsyncStorage helpers for FaithFrames
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

// ─── Generic ──────────────────────────────────────────────────────────────────
export const storeJSON = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently handle storage errors
  }
};

export const getJSON = async (key) => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silently handle storage errors
  }
};

// ─── Favorites ────────────────────────────────────────────────────────────────
export const getFavorites = async () =>
  (await getJSON(STORAGE_KEYS.FAVORITES)) || [];

export const addFavorite = async (wallpaperId) => {
  const favs = await getFavorites();
  if (!favs.includes(wallpaperId)) {
    await storeJSON(STORAGE_KEYS.FAVORITES, [...favs, wallpaperId]);
  }
};

export const removeFavorite = async (wallpaperId) => {
  const favs = await getFavorites();
  await storeJSON(
    STORAGE_KEYS.FAVORITES,
    favs.filter((id) => id !== wallpaperId)
  );
};

export const isFavorite = async (wallpaperId) => {
  const favs = await getFavorites();
  return favs.includes(wallpaperId);
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const setOnboardingDone = async () =>
  AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');

export const isOnboardingDone = async () => {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
  return val === 'true';
};

// ─── Library bookmarks ────────────────────────────────────────────────────────
export const getBookmarkIds = async (storageKey) =>
  (await getJSON(storageKey)) || [];

export const toggleBookmarkId = async (storageKey, id) => {
  const ids = await getBookmarkIds(storageKey);
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  await storeJSON(storageKey, next);
  return next;
};

export const cacheLibraryItems = async (storageKey, items) => {
  await storeJSON(storageKey, { items, cachedAt: Date.now() });
};

export const getCachedLibraryItems = async (storageKey) => {
  const cached = await getJSON(storageKey);
  // Ensure we ALWAYS return an array, no matter what!
  const items = cached?.items;
  return Array.isArray(items) ? items : [];
};
