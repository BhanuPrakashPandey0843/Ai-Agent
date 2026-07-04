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

console.log('🔍 [Firebase Service] DB initialized, project info:', db.app.options);

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

const normalizeStoryFields = (id, data = {}) => ({
  id,
  title: data.title || data.name || '',
  prophetName: data.prophetName || data.name || '',
  name: data.name || data.prophetName || '',
  shortdescription: data.shortdescription || data.description || '',
  description: data.shortdescription || data.description || '',
  fullstory: data.fullstory || data.content || '',
  content: data.fullstory || data.content || '',
  readingtime: data.readingtime || data.readingTime || '',
  coverimage: data.coverimage || data.image || data.bgurl || '',
  image: data.coverimage || data.image || data.bgurl || '',
  featured: data.featured === true,
  published: data.published !== false,
  author: data.author || 'admin',
  likes: Number(data.likes || 0),
  shares: Number(data.shares || 0),
  views: Number(data.views || 0),
  createdAt: data.createdAt || data.uploadedAt || null,
  updatedAt: data.updatedAt || null,
});

/** Accepts a Firestore doc snapshot or a plain { id, ...fields } object from safeOnSnapshot */
const mapStoryDoc = (docSnap) => {
  if (!docSnap) return null;
  const hasDataFn = typeof docSnap.data === 'function';
  const data = hasDataFn ? docSnap.data() : docSnap;
  const id = docSnap.id || data?.id || '';
  if (!id) return null;
  const { id: _ignored, ...rest } = data && typeof data === 'object' ? data : {};
  return normalizeStoryFields(id, rest);
};

const mapStoryDocs = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => mapStoryDoc(item)).filter(Boolean);
  }
  const docs = Array.isArray(input?.docs) ? input.docs : [];
  return docs.map((d) => mapStoryDoc(d)).filter(Boolean);
};

export const storyTimestamp = (item) => {
  const t = item?.createdAt;
  if (t && typeof t.toMillis === 'function') return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t;
  return 0;
};

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
  // Log query details
  const queryPath = queryRef?._query?.path?.toString() || 'unknown';
  console.log('🔍 [Firestore Query] Creating listener for:', queryPath);

  return onSnapshot(
    queryRef,
    (snap) => {
      console.log('✅ [Firestore Success] Query:', queryPath, '- Docs:', snap?.docs?.length);
      // Ensure we ALWAYS pass an array to onData, even if snap.docs is missing or undefined
      const items = Array.isArray(snap?.docs) ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
      onData(items);
    },
    (err) => {
      console.error('❌ [Firestore Error] Query:', queryPath);
      console.error('  - Error code:', err?.code);
      console.error('  - Error message:', err?.message);
      console.error('  - Full error:', err);
      if (onError) onError(err);
    }
  );
}

export const getFirestoreErrorMessage = (err) => {
  const code = err?.code || '';
  const message = err?.message || 'Unknown error';
  console.error('🔍 getFirestoreErrorMessage called with:', { code, message, err });
  if (code === 'permission-denied') {
    return `Firestore access denied (code: ${code}). Deploy firebase/firestore.rules in the Firebase Console.`;
  }
  if (code === 'unavailable') {
    return 'Firestore is temporarily unavailable. Check your connection.';
  }
  return `${message} (code: ${code})`;
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

export const subscribeToStories = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.STORIES),
    orderBy('createdAt', 'desc'),
    limit(40)
  );
  return safeOnSnapshot(
    q,
    (items) => {
      const stories = mapStoryDocs(items)
        .filter((story) => story.published)
        .sort((a, b) => storyTimestamp(b) - storyTimestamp(a));
      onData(stories);
    },
    onError
  );
};

export const subscribeToFeaturedStories = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.FEATURED_STORIES),
    orderBy('createdAt', 'desc'),
    limit(40)
  );
  return safeOnSnapshot(
    q,
    (items) => {
      const stories = mapStoryDocs(items)
        .filter((story) => story.published)
        .sort((a, b) => storyTimestamp(b) - storyTimestamp(a));
      onData(stories);
    },
    onError
  );
};

export const fetchStories = async () => {
  const q = query(
    collection(db, COLLECTIONS.STORIES),
    orderBy('createdAt', 'desc'),
    limit(40)
  );
  const snap = await getDocs(q);
  return mapStoryDocs(snap);
};

export const getStories = async () => fetchStories();

export const getFeaturedStories = async () => {
  const q = query(
    collection(db, COLLECTIONS.FEATURED_STORIES),
    orderBy('createdAt', 'desc'),
    limit(40)
  );
  const snap = await getDocs(q);
  return mapStoryDocs(snap)
    .filter((story) => story.published)
    .sort((a, b) => storyTimestamp(b) - storyTimestamp(a));
};

export const createStory = async (data) => {
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.STORIES), payload);
  return { id: docRef.id, ...payload };
};

export const updateStory = async (id, data) => {
  await updateDoc(doc(db, COLLECTIONS.STORIES, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteStory = async (id) => {
  await deleteDoc(doc(db, COLLECTIONS.STORIES, id));
};

export const toggleFeatured = async (id, currentFeatured) => {
  await updateDoc(doc(db, COLLECTIONS.STORIES, id), {
    featured: !currentFeatured,
    updatedAt: serverTimestamp(),
  });
};

export const togglePublished = async (id, currentPublished) => {
  await updateDoc(doc(db, COLLECTIONS.STORIES, id), {
    published: !currentPublished,
    updatedAt: serverTimestamp(),
  });
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
