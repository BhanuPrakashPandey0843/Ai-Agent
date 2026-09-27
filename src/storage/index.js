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

// ─── Stored-list change notifications ─────────────────────────────────────────
// AsyncStorage has no change events, so a hook that mirrors a stored list
// (favorites, story bookmarks, …) only ever sees the snapshot it read when it
// mounted. Long-lived screens — the Settings tab in particular, which stays
// mounted for the rest of the session once it is first opened — therefore kept
// rendering stale counts after the user favorited something on another screen.
// Every mutating helper below publishes the resulting list here, so all mounted
// readers of that key update together. The data itself still lives exactly
// where it always did; this only adds notification on top of it.
const listListeners = new Map(); // storageKey -> Set<listener>

export const subscribeToStoredList = (storageKey, listener) => {
  if (!storageKey || typeof listener !== 'function') return () => {};
  if (!listListeners.has(storageKey)) listListeners.set(storageKey, new Set());
  const set = listListeners.get(storageKey);
  set.add(listener);
  return () => {
    set.delete(listener);
    if (!set.size) listListeners.delete(storageKey);
  };
};

const emitStoredList = (storageKey, list) => {
  const set = listListeners.get(storageKey);
  if (!set) return;
  set.forEach((listener) => {
    try {
      listener(list);
    } catch {
      // a broken subscriber must never break the write that triggered it
    }
  });
};

// ─── Favorites ────────────────────────────────────────────────────────────────
export const getFavorites = async () =>
  (await getJSON(STORAGE_KEYS.FAVORITES)) || [];

export const addFavorite = async (wallpaperId) => {
  const favs = await getFavorites();
  const next = favs.includes(wallpaperId) ? favs : [...favs, wallpaperId];
  if (next !== favs) {
    await storeJSON(STORAGE_KEYS.FAVORITES, next);
  }
  emitStoredList(STORAGE_KEYS.FAVORITES, next);
  return next;
};

export const removeFavorite = async (wallpaperId) => {
  const favs = await getFavorites();
  const next = favs.filter((id) => id !== wallpaperId);
  await storeJSON(STORAGE_KEYS.FAVORITES, next);
  emitStoredList(STORAGE_KEYS.FAVORITES, next);
  return next;
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
  emitStoredList(storageKey, next);
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

// ─── Prayer Drafts ────────────────────────────────────────────────────────────
export const getPrayerDraft = async (storageKey) => {
  return (await getJSON(storageKey)) || null;
};

export const savePrayerDraft = async (storageKey, draft) => {
  await storeJSON(storageKey, { ...draft, savedAt: Date.now() });
};

export const clearPrayerDraft = async (storageKey) => {
  await removeItem(storageKey);
};
