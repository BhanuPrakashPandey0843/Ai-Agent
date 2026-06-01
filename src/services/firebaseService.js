// src/services/firebaseService.js
// Central Firestore data-fetching layer for FaithFrames.
// All collection names mirror the admin panel exactly.

import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS, PAGE_SIZE } from '../constants';
import { fetchAllQuestionsFromFirestore } from './quizService';

const mapWallpaperDocs = (snapshot) =>
  snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

const wallpaperTimestamp = (item) => {
  const t = item?.uploadedAt;
  if (t && typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t === 'number') return t;
  return 0;
};

const sortWallpapersNewest = (items) =>
  [...items].sort((a, b) => wallpaperTimestamp(b) - wallpaperTimestamp(a));

/** Query without composite index — client sort */
const fetchWallpapersUnindexed = async (category = null) => {
  let q = query(collection(db, COLLECTIONS.WALLPAPERS), limit(100));
  if (category && category !== 'all') {
    q = query(
      collection(db, COLLECTIONS.WALLPAPERS),
      where('category', '==', category),
      limit(100)
    );
  }
  const snapshot = await getDocs(q);
  const sorted = sortWallpapersNewest(mapWallpaperDocs(snapshot));
  return {
    items: sorted.slice(0, PAGE_SIZE),
    lastVisible: null,
    hasMore: sorted.length > PAGE_SIZE,
    fromDemo: false,
  };
};

/** onSnapshot with error callback — prevents uncaught listener crashes */
function safeOnSnapshot(queryRef, onData, onError) {
  return onSnapshot(
    queryRef,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      if (onError) onError(err);
    }
  );
}

export const getFirestoreErrorMessage = (err) => {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return 'Firestore access denied. Deploy firebase/firestore.rules in the Firebase Console.';
  }
  if (code === 'unavailable') {
    return 'Firestore is temporarily unavailable. Check your connection.';
  }
  return err?.message || 'Failed to load data';
};

// ─── Wallpapers ───────────────────────────────────────────────────────────────

/** Fetch paginated wallpapers, optionally filtered by category */
export const fetchWallpapers = async (category = null, lastDoc = null) => {
  try {
    let q = query(
      collection(db, COLLECTIONS.WALLPAPERS),
      orderBy('uploadedAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (category && category !== 'all') {
      q = query(
        collection(db, COLLECTIONS.WALLPAPERS),
        where('category', '==', category),
        orderBy('uploadedAt', 'desc'),
        limit(PAGE_SIZE)
      );
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const items = mapWallpaperDocs(snapshot);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return {
      items,
      lastVisible,
      hasMore: snapshot.docs.length === PAGE_SIZE,
      fromDemo: false,
    };
  } catch (err) {
    if (err?.code === 'failed-precondition') {
      return fetchWallpapersUnindexed(category);
    }
    throw err;
  }
};

/** Fetch a single wallpaper by ID */
export const fetchWallpaperById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTIONS.WALLPAPERS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Real-time listener for latest wallpapers (home screen) */
export const subscribeToWallpapers = (onData, limitCount = 20, onError) => {
  const q = query(
    collection(db, COLLECTIONS.WALLPAPERS),
    orderBy('uploadedAt', 'desc'),
    limit(limitCount)
  );
  return safeOnSnapshot(q, onData, onError);
};

/** Fetch wallpapers by category for category screen */
export const fetchWallpapersByCategory = async (category) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.WALLPAPERS),
      where('category', '==', category),
      orderBy('uploadedAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);
    return mapWallpaperDocs(snap);
  } catch (err) {
    if (err?.code === 'failed-precondition') {
      const { items } = await fetchWallpapersUnindexed(category);
      return items;
    }
    throw err;
  }
};

/** Search wallpapers by title (client-side filter after Firestore fetch) */
export const searchWallpapers = async (searchText) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.WALLPAPERS),
      orderBy('uploadedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lower = searchText.toLowerCase();
    return all.filter(
      (w) =>
        w.title?.toLowerCase().includes(lower) ||
        w.category?.toLowerCase().includes(lower) ||
        w.country?.toLowerCase().includes(lower)
    );
  } catch (err) {
    if (err?.code === 'failed-precondition') {
      const { items } = await fetchWallpapersUnindexed(null);
      const lower = searchText.toLowerCase();
      return items.filter(
        (w) =>
          w.title?.toLowerCase().includes(lower) ||
          w.category?.toLowerCase().includes(lower) ||
          w.country?.toLowerCase().includes(lower)
      );
    }
    throw err;
  }
};

// ─── Daily Verses ─────────────────────────────────────────────────────────────

export const fetchDailyVerses = async () => {
  const q = query(
    collection(db, COLLECTIONS.DAILY_VERSES),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeToDailyVerses = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.DAILY_VERSES),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  return safeOnSnapshot(q, onData, onError);
};

// ─── Daily Prayers ────────────────────────────────────────────────────────────

export const fetchDailyPrayers = async () => {
  const q = query(
    collection(db, COLLECTIONS.DAILY_PRAYERS),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeToDailyPrayers = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.DAILY_PRAYERS),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return safeOnSnapshot(q, onData, onError);
};

// ─── Quotes ───────────────────────────────────────────────────────────────────

export const fetchQuotes = async () => {
  const q = query(
    collection(db, COLLECTIONS.QUOTES),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeToQuotes = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.QUOTES),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return safeOnSnapshot(q, onData, onError);
};

// ─── Quiz Questions ───────────────────────────────────────────────────────────

/** @deprecated Use quiz module (`getQuestionsCatalog` / `prepareQuizSession`) */
export const fetchQuizQuestions = async (category = null) => {
  const items = await fetchAllQuestionsFromFirestore();
  const active = items.filter((q) => q.active !== false);
  if (!category) return active;
  return active.filter((q) => q.category === category);
};

// ─── User Profile ─────────────────────────────────────────────────────────────

export const fetchUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ─── God's Words (Stories / Inspiration) ────────────────────────────────────

export const subscribeToGodsWords = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.GODSWORDS),
    orderBy('createdAt', 'desc'),
    limit(15)
  );
  return safeOnSnapshot(q, onData, onError);
};

export const fetchGodsWords = async () => {
  const q = query(
    collection(db, COLLECTIONS.GODSWORDS),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Witness (Stories) ────────────────────────────────────────────────────────

export const subscribeToWitness = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.WITNESS),
    orderBy('createdAt', 'desc'),
    limit(15)
  );
  return safeOnSnapshot(q, onData, onError);
};

export const fetchWitness = async () => {
  const q = query(
    collection(db, COLLECTIONS.WITNESS),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateUserScore = async (uid, score) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    lastScore: score,
    lastPlayed: new Date(),
    updatedAt: Date.now(),
  });
};

// ─── Meet Sessions ────────────────────────────────────────────────────────────

export const fetchMeetSessions = async () => {
  const q = query(
    collection(db, COLLECTIONS.MEET_SHARE),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeToMeetSessions = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.MEET_SHARE),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return safeOnSnapshot(q, onData, onError);
};
