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
  setDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  getCountFromServer,
  runTransaction,
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
  title: data.title || '',
  shortdescription: data.shortdescription || data.description || '',
  description: data.shortdescription || data.description || '',
  fullstory: data.fullstory || data.content || '',
  content: data.fullstory || data.content || '',
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
    const all = snap.docs.map((d) => ({ id: d.id, type: 'wallpaper', ...d.data() }));
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
      return items.map(i => ({ ...i, type: 'wallpaper' })).filter(
        (w) =>
          w.title?.toLowerCase().includes(lower) ||
          w.category?.toLowerCase().includes(lower) ||
          w.country?.toLowerCase().includes(lower)
      );
    }
    throw err;
  }
};

/** Search stories by title, description */
export const searchStories = async (searchText) => {
  const lower = searchText.toLowerCase();
  const [stories, featuredStories] = await Promise.all([
    getStories(),
    getFeaturedStories(),
  ]);
  const allStories = [...stories, ...featuredStories]
    .filter((s) => s.published)
    .map(s => ({ ...s, type: 'story' }));
  return allStories.filter(
    (s) =>
      s.title?.toLowerCase().includes(lower) ||
      s.description?.toLowerCase().includes(lower) ||
      s.shortdescription?.toLowerCase().includes(lower) ||
      s.prophetName?.toLowerCase().includes(lower)
  );
};

/** Search daily verses */
export const searchDailyVerses = async (searchText) => {
  const snap = await getDocs(query(
    collection(db, COLLECTIONS.DAILY_VERSES),
    orderBy('createdAt', 'desc'),
    limit(50)
  ));
  const all = snap.docs.map((d) => ({ id: d.id, type: 'verse', ...d.data() }));
  const lower = searchText.toLowerCase();
  return all.filter(
    (v) =>
      v.verse?.toLowerCase().includes(lower) ||
      v.reference?.toLowerCase().includes(lower) ||
      v.text?.toLowerCase().includes(lower)
  );
};

/** Search quotes */
export const searchQuotes = async (searchText) => {
  const snap = await getDocs(query(
    collection(db, COLLECTIONS.QUOTES),
    orderBy('createdAt', 'desc'),
    limit(50)
  ));
  const all = snap.docs.map((d) => ({ id: d.id, type: 'quote', ...d.data() }));
  const lower = searchText.toLowerCase();
  return all.filter(
    (q) =>
      q.text?.toLowerCase().includes(lower) ||
      q.author?.toLowerCase().includes(lower) ||
      q.category?.toLowerCase().includes(lower)
  );
};

/** Unified search across all content types */
export const searchAll = async (searchText) => {
  if (!searchText.trim()) return [];
  const [wallpapers, stories, verses, quotes] = await Promise.all([
    searchWallpapers(searchText),
    searchStories(searchText),
    searchDailyVerses(searchText),
    searchQuotes(searchText),
  ]);
  return [...wallpapers, ...stories, ...verses, ...quotes];
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

// ─── Live Worship Room ────────────────────────────────────────────────────────
// Reads the same `meetSessions` collection (source of truth: admin panel at
// /admin/uploads/upload-meet). Each doc can now carry a richer set of fields;
// legacy docs (message/meetLink/likes/dislikes) still normalize safely.

const toMillis = (val) => {
  if (!val) return null;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return Number.isNaN(t) ? null : t;
  }
  if (val?.seconds) return val.seconds * 1000;
  return null;
};

const dateOnlyString = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal?.toDate === 'function') return dateVal.toDate().toDateString();
  if (typeof dateVal === 'string') return dateVal;
  const ms = toMillis(dateVal);
  return ms ? new Date(ms).toDateString() : null;
};

/** Derive start/end epoch ms from either explicit timestamps or date+time strings */
const buildMeetingWindow = (data) => {
  let startMs = toMillis(data.startAt) || null;
  let endMs = toMillis(data.endAt) || null;

  const dateVal = data.date || data.meetingDate || null;
  const dateStr = dateOnlyString(dateVal);
  const startTimeVal = data.startTime || data.time || null;
  const endTimeVal = data.endTime || null;

  if (!startMs && dateStr) {
    if (startTimeVal) {
      const combined = Date.parse(`${dateStr} ${startTimeVal}`);
      if (!Number.isNaN(combined)) startMs = combined;
    }
    if (!startMs) {
      const dOnly = Date.parse(dateStr);
      if (!Number.isNaN(dOnly)) startMs = dOnly;
    }
  }

  if (!endMs && dateStr && endTimeVal) {
    const combined = Date.parse(`${dateStr} ${endTimeVal}`);
    if (!Number.isNaN(combined)) endMs = combined;
  }
  if (!endMs && startMs) endMs = startMs + 2 * 60 * 60 * 1000; // default 2-hour window

  return { startMs, endMs };
};

const deriveMeetingStatus = (data, startMs, endMs) => {
  const manual = String(data.status || '').toLowerCase();
  if (['live', 'upcoming', 'ended'].includes(manual)) return manual;
  const now = Date.now();
  if (startMs && now < startMs) return 'upcoming';
  if (endMs && now > endMs) return 'ended';
  if (startMs) return 'live';
  return 'upcoming';
};

/** Normalize a raw meetSessions doc into the shape the Live Worship Room screen renders */
export const normalizeLiveWorship = (id, data = {}) => {
  const { startMs, endMs } = buildMeetingWindow(data);
  const status = deriveMeetingStatus(data, startMs, endMs);
  return {
    id,
    title: data.title || data.meetingTitle || data.message || 'Join our worship gathering',
    subtitle: data.subtitle || data.description || '',
    imageUrl: data.imageUrl || data.image || data.bannerUrl || '',
    verseText: data.verseText || data.verse || '',
    verseReference: data.verseReference || data.reference || '',
    dateLabel:
      data.dateLabel ||
      (startMs
        ? new Date(startMs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        : (typeof data.date === 'string' ? data.date : '')),
    timeLabel:
      data.timeLabel ||
      (startMs
        ? new Date(startMs).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
        : (data.startTime || data.time || '')),
    endTimeLabel: data.endTime || '',
    meetLink: (data.meetLink || data.link || '').trim(),
    platform: data.platform || '',
    ctaText: data.ctaText || 'Join Meeting',
    published: data.published !== false,
    startMs,
    endMs,
    status,
    createdAt: data.createdAt || null,
  };
};

const pickActiveMeeting = (list) => {
  const live = list.filter((m) => m.status === 'live');
  if (live.length) return live.sort((a, b) => (b.startMs || 0) - (a.startMs || 0))[0];

  const upcoming = list
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => (a.startMs ?? Infinity) - (b.startMs ?? Infinity));
  if (upcoming.length) return upcoming[0];

  const ended = list
    .filter((m) => m.status === 'ended')
    .sort((a, b) => (b.startMs || 0) - (a.startMs || 0));
  return ended[0] || null;
};

/** Real-time listener returning the single most relevant Live Worship meeting (or null) */
export const subscribeToLiveWorshipMeeting = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.MEET_SHARE),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  return safeOnSnapshot(
    q,
    (items) => {
      const normalized = items
        .map((d) => normalizeLiveWorship(d.id, d))
        .filter((m) => m.published);
      onData(pickActiveMeeting(normalized));
    },
    onError
  );
};

/**
 * Every meeting worth showing right now: all `live` sessions (newest first),
 * then all `upcoming` sessions (soonest first). Only if there are none of
 * those does it fall back to the single most recently `ended` session, so
 * the room never renders completely empty right after a meeting wraps up.
 * This is what fixes "I scheduled 3 meetings but only 1 shows up" — the
 * single-meeting picker (`pickActiveMeeting` above) was always meant to
 * pick one *featured* meeting, not hide the rest.
 */
const sortRelevantMeetings = (list) => {
  const live = [...list]
    .filter((m) => m.status === 'live')
    .sort((a, b) => (b.startMs || 0) - (a.startMs || 0));
  const upcoming = [...list]
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => (a.startMs ?? Infinity) - (b.startMs ?? Infinity));
  if (live.length || upcoming.length) return [...live, ...upcoming];

  const ended = [...list]
    .filter((m) => m.status === 'ended')
    .sort((a, b) => (b.startMs || 0) - (a.startMs || 0));
  return ended.slice(0, 1);
};

/** Real-time listener returning EVERY currently-relevant Live Worship meeting. */
export const subscribeToLiveWorshipMeetings = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.MEET_SHARE),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return safeOnSnapshot(
    q,
    (items) => {
      const normalized = items
        .map((d) => normalizeLiveWorship(d.id, d))
        .filter((m) => m.published);
      onData(sortRelevantMeetings(normalized));
    },
    onError
  );
};

// ─── Live Worship RSVP (one response per authenticated user) ─────────────────

export const getUserRsvpResponse = async (meetingId, uid) => {
  if (!meetingId || !uid) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.MEET_SHARE, meetingId, 'rsvps', uid));
  return snap.exists() ? snap.data().response || null : null;
};

export const setUserRsvpResponse = async (meetingId, uid, response) => {
  if (!meetingId || !uid) throw new Error('Missing meeting or user id');
  await setDoc(
    doc(db, COLLECTIONS.MEET_SHARE, meetingId, 'rsvps', uid),
    { response, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

export const fetchRsvpCounts = async (meetingId) => {
  if (!meetingId) return { going: 0, notGoing: 0 };
  const base = collection(db, COLLECTIONS.MEET_SHARE, meetingId, 'rsvps');
  try {
    const [goingSnap, notGoingSnap] = await Promise.all([
      getCountFromServer(query(base, where('response', '==', 'going'))),
      getCountFromServer(query(base, where('response', '==', 'not_going'))),
    ]);
    return { going: goingSnap.data().count, notGoing: notGoingSnap.data().count };
  } catch {
    return { going: 0, notGoing: 0 };
  }
};

// ─── Witness Videos ────────────────────────────────────────────────────────
// Hero carousel (witnessCarousel) + video catalogue (witnessVideos) — both
// fully admin-controlled (see /admin/witness-videos in the admin panel).
// Reads only here; all document writes go through the Admin SDK. The one
// exception is the narrow, rule-enforced view/like/dislike counter nudge
// and the per-user interaction/saved-video docs below, which mirror
// firestore.rules exactly.

/** Active hero banners, admin display order. */
export const subscribeToWitnessCarousel = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.WITNESS_CAROUSEL)
  );
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive === true);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

/** Active video catalogue, newest first (matches the isActive+publishedAt index). */
export const subscribeToWitnessVideos = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.WITNESS_VIDEOS)
  );
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive === true);
    const sortedItems = filteredItems.sort((a, b) => {
      const timeA = a.publishedAt?.toMillis ? a.publishedAt.toMillis() : (a.publishedAt || 0);
      const timeB = b.publishedAt?.toMillis ? b.publishedAt.toMillis() : (b.publishedAt || 0);
      return timeB - timeA;
    });
    onData(sortedItems.slice(0, 50));
  }, onError);
};

export const fetchWitnessVideoById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.WITNESS_VIDEOS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Same-category videos for the "Related videos" rail on the player screen. */
export const fetchRelatedWitnessVideos = async (category, excludeId, max = 8) => {
  if (!category) return [];
  const q = query(
    collection(db, COLLECTIONS.WITNESS_VIDEOS),
    where('isActive', '==', true),
    where('category', '==', category),
    orderBy('publishedAt', 'desc'),
    limit(max + 1)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((v) => v.id !== excludeId)
    .slice(0, max);
};

// ─── Witness Video per-user interactions (like / dislike / view) ─────────────
// witnessVideos/{id}/userInteractions/{uid} tracks this user's flags.
// firestore.rules enforces: parent doc counters may only move by exactly
// ±1 per write, and liked+disliked can never both be true — so every
// mutation below goes through a transaction to stay race-safe and rule-valid.

export const getUserVideoInteraction = async (videoId, uid) => {
  if (!videoId || !uid) return { liked: false, disliked: false, viewed: false };
  const snap = await getDoc(doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId, 'userInteractions', uid));
  return snap.exists()
    ? { liked: false, disliked: false, viewed: false, ...snap.data() }
    : { liked: false, disliked: false, viewed: false };
};

/** Toggle like (mutually exclusive with dislike). Returns the new liked state. */
export const toggleVideoLike = async (videoId, uid) => {
  if (!videoId || !uid) throw new Error('Missing video or user id');
  const videoRef = doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId);
  const interactionRef = doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextLiked = !current.liked;
    const wasDisliked = current.disliked === true;

    tx.set(
      interactionRef,
      { liked: nextLiked, disliked: false, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(videoRef, {
      likes: increment(nextLiked ? 1 : -1),
      ...(wasDisliked ? { dislikes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextLiked;
  });
};

/** Toggle dislike (mutually exclusive with like). Returns the new disliked state. */
export const toggleVideoDislike = async (videoId, uid) => {
  if (!videoId || !uid) throw new Error('Missing video or user id');
  const videoRef = doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId);
  const interactionRef = doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextDisliked = !current.disliked;
    const wasLiked = current.liked === true;

    tx.set(
      interactionRef,
      { liked: false, disliked: nextDisliked, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(videoRef, {
      dislikes: increment(nextDisliked ? 1 : -1),
      ...(wasLiked ? { likes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextDisliked;
  });
};

/**
 * Count exactly one view per user, only after meaningful watch duration
 * (caller decides the threshold — see VideoPlayerScreen). No-ops silently
 * if already counted or if the write fails, since a missed view increment
 * should never surface as a user-facing error.
 */
export const registerVideoView = async (videoId, uid) => {
  if (!videoId || !uid) return;
  const videoRef = doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId);
  const interactionRef = doc(db, COLLECTIONS.WITNESS_VIDEOS, videoId, 'userInteractions', uid);
  try {
    await runTransaction(db, async (tx) => {
      const interactionSnap = await tx.get(interactionRef);
      const current = interactionSnap.exists()
        ? interactionSnap.data()
        : { liked: false, disliked: false, viewed: false };
      if (current.viewed === true) return;
      tx.set(
        interactionRef,
        { liked: current.liked === true, disliked: current.disliked === true, viewed: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      tx.update(videoRef, { views: increment(1), updatedAt: serverTimestamp() });
    });
  } catch (err) {
    console.warn('[registerVideoView] failed:', err?.message);
  }
};

// ─── Saved Witness Videos (Favorites) ─────────────────────────────────────────
// users/{uid}/savedVideos/{videoId} — owner-only subcollection, small
// denormalized snapshot so the Saved list renders without extra reads.

export const subscribeToSavedVideos = (uid, onData, onError) => {
  if (!uid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTIONS.USERS, uid, 'savedVideos'), orderBy('savedAt', 'desc'));
  return safeOnSnapshot(q, onData, onError);
};

export const isVideoSaved = async (uid, videoId) => {
  if (!uid || !videoId) return false;
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid, 'savedVideos', videoId));
  return snap.exists();
};

/** Toggle save on/off. Returns the new saved state. */
export const toggleSaveVideo = async (uid, video) => {
  if (!uid || !video?.id) throw new Error('Missing user or video');
  const ref = doc(db, COLLECTIONS.USERS, uid, 'savedVideos', video.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    videoId: video.id,
    title: video.title || '',
    thumbnail: video.thumbnail || '',
    duration: video.duration || 0,
    category: video.category || '',
    savedAt: serverTimestamp(),
  });
  return true;
};

// ─── Bible Management ───────────────────────────────────────────────────────

/** Active Bible reading plans, ordered by displayOrder */
export const subscribeToBibleReadingPlans = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.BIBLE_READING_PLANS));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive !== false);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

/** Active Bible daily verses */
export const subscribeToBibleDailyVerses = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.BIBLE_DAILY_VERSES));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive !== false);
    onData(filteredItems);
  }, onError);
};

/** Active Bible banners, ordered by displayOrder */
export const subscribeToBibleBanners = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.BIBLE_BANNERS));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive !== false);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

/** Active Bible announcements */
export const subscribeToBibleAnnouncements = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.BIBLE_ANNOUNCEMENTS));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive !== false);
    onData(filteredItems);
  }, onError);
};

// ─── Faith Content (Bible / Jesus / Prayers / Worship) ────────────────────
// Shared shape + ordering for the four "Explore Faith" content catalogues.
// The admin Content Manager writes `displayOrder` (drag-to-reorder) and
// `createdAt` (serverTimestamp) — it never writes `publishedAt` — so content
// must be ordered the same way the carousel already is, or admin reordering
// silently has no effect in the app. All four collections share this exact
// document shape (see ContentManager.js + sanitizeContentPayload).

const contentCreatedAtMillis = (item) => {
  const t = item?.createdAt;
  if (t && typeof t.toMillis === 'function') return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  if (typeof t === 'number') return t;
  return 0;
};

/** Normalize a raw bibleContent/jesusContent/prayersContent/worshipContent doc. */
const normalizeContentItem = (item = {}) => ({
  ...item,
  title: item.title || '',
  description: item.description || '',
  category: item.category || '',
  contentTypeId: item.contentTypeId || '',
  thumbnail: item.thumbnail || '',
  // Admin stores the video URL under `video`; player/share code expects
  // `videoUrl` — expose both so either name works everywhere.
  video: item.video || item.videoUrl || '',
  videoUrl: item.video || item.videoUrl || '',
  scriptPassage: item.scriptPassage || '',
  isActive: item.isActive !== false,
  isPremium: item.isPremium === true,
  views: Number(item.views || 0),
  likes: Number(item.likes || 0),
  dislikes: Number(item.dislikes || 0),
  displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : 0,
});

/** Order by admin displayOrder first (matches drag-to-reorder), newest createdAt as tiebreak. */
const sortContentItems = (items) =>
  [...items].sort((a, b) => {
    const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return contentCreatedAtMillis(b) - contentCreatedAtMillis(a);
  });

// ─── Bible Content ────────────────────────────────────────────────────────

export const subscribeToBibleCarousel = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.BIBLE_CAROUSEL));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive === true);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

export const subscribeToBibleContent = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.BIBLE_CONTENT));
  return safeOnSnapshot(q, (items) => {
    const normalized = items.filter(item => item.isActive === true).map(normalizeContentItem);
    onData(sortContentItems(normalized).slice(0, 50));
  }, onError);
};

export const fetchBibleContentById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.BIBLE_CONTENT, id));
  return snap.exists() ? normalizeContentItem({ id: snap.id, ...snap.data() }) : null;
};

/** Same-category content for the "Related" rail on the content detail screen. */
export const fetchRelatedBibleContent = async (category, excludeId, max = 8) => {
  if (!category) return [];
  const q = query(collection(db, COLLECTIONS.BIBLE_CONTENT), where('isActive', '==', true), where('category', '==', category));
  const snap = await getDocs(q);
  return sortContentItems(
    snap.docs.map((d) => normalizeContentItem({ id: d.id, ...d.data() })).filter((v) => v.id !== excludeId)
  ).slice(0, max);
};

export const getUserBibleInteraction = async (contentId, uid) => {
  if (!contentId || !uid) return { liked: false, disliked: false, viewed: false };
  const snap = await getDoc(doc(db, COLLECTIONS.BIBLE_CONTENT, contentId, 'userInteractions', uid));
  return snap.exists()
    ? { liked: false, disliked: false, viewed: false, ...snap.data() }
    : { liked: false, disliked: false, viewed: false };
};

export const toggleBibleLike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.BIBLE_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.BIBLE_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextLiked = !current.liked;
    const wasDisliked = current.disliked === true;

    tx.set(
      interactionRef,
      { liked: nextLiked, disliked: false, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      likes: increment(nextLiked ? 1 : -1),
      ...(wasDisliked ? { dislikes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextLiked;
  });
};

export const toggleBibleDislike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.BIBLE_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.BIBLE_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextDisliked = !current.disliked;
    const wasLiked = current.liked === true;

    tx.set(
      interactionRef,
      { liked: false, disliked: nextDisliked, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      dislikes: increment(nextDisliked ? 1 : -1),
      ...(wasLiked ? { likes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextDisliked;
  });
};

export const registerBibleView = async (contentId, uid) => {
  if (!contentId || !uid) return;
  const contentRef = doc(db, COLLECTIONS.BIBLE_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.BIBLE_CONTENT, contentId, 'userInteractions', uid);
  try {
    await runTransaction(db, async (tx) => {
      const interactionSnap = await tx.get(interactionRef);
      const current = interactionSnap.exists()
        ? interactionSnap.data()
        : { liked: false, disliked: false, viewed: false };
      if (current.viewed === true) return;
      tx.set(
        interactionRef,
        { liked: current.liked === true, disliked: current.disliked === true, viewed: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      tx.update(contentRef, { views: increment(1), updatedAt: serverTimestamp() });
    });
  } catch (err) {
    console.warn('[registerBibleView] failed:', err?.message);
  }
};

export const subscribeToSavedBibleContent = (uid, onData, onError) => {
  if (!uid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTIONS.USERS, uid, 'savedBibleContent'), orderBy('savedAt', 'desc'));
  return safeOnSnapshot(q, onData, onError);
};

export const isBibleContentSaved = async (uid, contentId) => {
  if (!uid || !contentId) return false;
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid, 'savedBibleContent', contentId));
  return snap.exists();
};

export const toggleSaveBibleContent = async (uid, content) => {
  if (!uid || !content?.id) throw new Error('Missing user or content');
  const ref = doc(db, COLLECTIONS.USERS, uid, 'savedBibleContent', content.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    contentId: content.id,
    title: content.title || '',
    thumbnail: content.thumbnail || '',
    type: content.type || '',
    savedAt: serverTimestamp(),
  });
  return true;
};

// ─── Jesus Content ────────────────────────────────────────────────────────

export const subscribeToJesusCarousel = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.JESUS_CAROUSEL));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive === true);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

export const subscribeToJesusContent = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.JESUS_CONTENT));
  return safeOnSnapshot(q, (items) => {
    const normalized = items.filter(item => item.isActive === true).map(normalizeContentItem);
    onData(sortContentItems(normalized).slice(0, 50));
  }, onError);
};

export const fetchJesusContentById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.JESUS_CONTENT, id));
  return snap.exists() ? normalizeContentItem({ id: snap.id, ...snap.data() }) : null;
};

export const fetchRelatedJesusContent = async (category, excludeId, max = 8) => {
  if (!category) return [];
  const q = query(collection(db, COLLECTIONS.JESUS_CONTENT), where('isActive', '==', true), where('category', '==', category));
  const snap = await getDocs(q);
  return sortContentItems(
    snap.docs.map((d) => normalizeContentItem({ id: d.id, ...d.data() })).filter((v) => v.id !== excludeId)
  ).slice(0, max);
};

export const getUserJesusInteraction = async (contentId, uid) => {
  if (!contentId || !uid) return { liked: false, disliked: false, viewed: false };
  const snap = await getDoc(doc(db, COLLECTIONS.JESUS_CONTENT, contentId, 'userInteractions', uid));
  return snap.exists()
    ? { liked: false, disliked: false, viewed: false, ...snap.data() }
    : { liked: false, disliked: false, viewed: false };
};

export const toggleJesusLike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.JESUS_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.JESUS_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextLiked = !current.liked;
    const wasDisliked = current.disliked === true;

    tx.set(
      interactionRef,
      { liked: nextLiked, disliked: false, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      likes: increment(nextLiked ? 1 : -1),
      ...(wasDisliked ? { dislikes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextLiked;
  });
};

export const toggleJesusDislike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.JESUS_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.JESUS_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextDisliked = !current.disliked;
    const wasLiked = current.liked === true;

    tx.set(
      interactionRef,
      { liked: false, disliked: nextDisliked, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      dislikes: increment(nextDisliked ? 1 : -1),
      ...(wasLiked ? { likes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextDisliked;
  });
};

export const registerJesusView = async (contentId, uid) => {
  if (!contentId || !uid) return;
  const contentRef = doc(db, COLLECTIONS.JESUS_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.JESUS_CONTENT, contentId, 'userInteractions', uid);
  try {
    await runTransaction(db, async (tx) => {
      const interactionSnap = await tx.get(interactionRef);
      const current = interactionSnap.exists()
        ? interactionSnap.data()
        : { liked: false, disliked: false, viewed: false };
      if (current.viewed === true) return;
      tx.set(
        interactionRef,
        { liked: current.liked === true, disliked: current.disliked === true, viewed: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      tx.update(contentRef, { views: increment(1), updatedAt: serverTimestamp() });
    });
  } catch (err) {
    console.warn('[registerJesusView] failed:', err?.message);
  }
};

export const subscribeToSavedJesusContent = (uid, onData, onError) => {
  if (!uid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTIONS.USERS, uid, 'savedJesusContent'), orderBy('savedAt', 'desc'));
  return safeOnSnapshot(q, onData, onError);
};

export const isJesusContentSaved = async (uid, contentId) => {
  if (!uid || !contentId) return false;
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid, 'savedJesusContent', contentId));
  return snap.exists();
};

export const toggleSaveJesusContent = async (uid, content) => {
  if (!uid || !content?.id) throw new Error('Missing user or content');
  const ref = doc(db, COLLECTIONS.USERS, uid, 'savedJesusContent', content.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    contentId: content.id,
    title: content.title || '',
    thumbnail: content.thumbnail || '',
    type: content.type || '',
    savedAt: serverTimestamp(),
  });
  return true;
};

// ─── Prayers Content ────────────────────────────────────────────────────────

export const subscribeToPrayersCarousel = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.PRAYERS_CAROUSEL));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive === true);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

export const subscribeToPrayersContent = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.PRAYERS_CONTENT));
  return safeOnSnapshot(q, (items) => {
    const normalized = items.filter(item => item.isActive === true).map(normalizeContentItem);
    onData(sortContentItems(normalized).slice(0, 50));
  }, onError);
};

export const fetchPrayersContentById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.PRAYERS_CONTENT, id));
  return snap.exists() ? normalizeContentItem({ id: snap.id, ...snap.data() }) : null;
};

export const fetchRelatedPrayersContent = async (category, excludeId, max = 8) => {
  if (!category) return [];
  const q = query(collection(db, COLLECTIONS.PRAYERS_CONTENT), where('isActive', '==', true), where('category', '==', category));
  const snap = await getDocs(q);
  return sortContentItems(
    snap.docs.map((d) => normalizeContentItem({ id: d.id, ...d.data() })).filter((v) => v.id !== excludeId)
  ).slice(0, max);
};

export const getUserPrayersInteraction = async (contentId, uid) => {
  if (!contentId || !uid) return { liked: false, disliked: false, viewed: false };
  const snap = await getDoc(doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId, 'userInteractions', uid));
  return snap.exists()
    ? { liked: false, disliked: false, viewed: false, ...snap.data() }
    : { liked: false, disliked: false, viewed: false };
};

export const togglePrayersLike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextLiked = !current.liked;
    const wasDisliked = current.disliked === true;

    tx.set(
      interactionRef,
      { liked: nextLiked, disliked: false, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      likes: increment(nextLiked ? 1 : -1),
      ...(wasDisliked ? { dislikes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextLiked;
  });
};

export const togglePrayersDislike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextDisliked = !current.disliked;
    const wasLiked = current.liked === true;

    tx.set(
      interactionRef,
      { liked: false, disliked: nextDisliked, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      dislikes: increment(nextDisliked ? 1 : -1),
      ...(wasLiked ? { likes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextDisliked;
  });
};

export const registerPrayersView = async (contentId, uid) => {
  if (!contentId || !uid) return;
  const contentRef = doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.PRAYERS_CONTENT, contentId, 'userInteractions', uid);
  try {
    await runTransaction(db, async (tx) => {
      const interactionSnap = await tx.get(interactionRef);
      const current = interactionSnap.exists()
        ? interactionSnap.data()
        : { liked: false, disliked: false, viewed: false };
      if (current.viewed === true) return;
      tx.set(
        interactionRef,
        { liked: current.liked === true, disliked: current.disliked === true, viewed: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      tx.update(contentRef, { views: increment(1), updatedAt: serverTimestamp() });
    });
  } catch (err) {
    console.warn('[registerPrayersView] failed:', err?.message);
  }
};

export const subscribeToSavedPrayersContent = (uid, onData, onError) => {
  if (!uid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTIONS.USERS, uid, 'savedPrayersContent'), orderBy('savedAt', 'desc'));
  return safeOnSnapshot(q, onData, onError);
};

export const isPrayersContentSaved = async (uid, contentId) => {
  if (!uid || !contentId) return false;
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid, 'savedPrayersContent', contentId));
  return snap.exists();
};

export const toggleSavePrayersContent = async (uid, content) => {
  if (!uid || !content?.id) throw new Error('Missing user or content');
  const ref = doc(db, COLLECTIONS.USERS, uid, 'savedPrayersContent', content.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    contentId: content.id,
    title: content.title || '',
    thumbnail: content.thumbnail || '',
    type: content.type || '',
    savedAt: serverTimestamp(),
  });
  return true;
};

// ─── Worship Content ────────────────────────────────────────────────────────

export const subscribeToWorshipCarousel = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.WORSHIP_CAROUSEL));
  return safeOnSnapshot(q, (items) => {
    const filteredItems = items.filter(item => item.isActive === true);
    const sortedItems = filteredItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    onData(sortedItems);
  }, onError);
};

export const subscribeToWorshipContent = (onData, onError) => {
  const q = query(collection(db, COLLECTIONS.WORSHIP_CONTENT));
  return safeOnSnapshot(q, (items) => {
    const normalized = items.filter(item => item.isActive === true).map(normalizeContentItem);
    onData(sortContentItems(normalized).slice(0, 50));
  }, onError);
};

export const fetchWorshipContentById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.WORSHIP_CONTENT, id));
  return snap.exists() ? normalizeContentItem({ id: snap.id, ...snap.data() }) : null;
};

export const fetchRelatedWorshipContent = async (category, excludeId, max = 8) => {
  if (!category) return [];
  const q = query(collection(db, COLLECTIONS.WORSHIP_CONTENT), where('isActive', '==', true), where('category', '==', category));
  const snap = await getDocs(q);
  return sortContentItems(
    snap.docs.map((d) => normalizeContentItem({ id: d.id, ...d.data() })).filter((v) => v.id !== excludeId)
  ).slice(0, max);
};

export const getUserWorshipInteraction = async (contentId, uid) => {
  if (!contentId || !uid) return { liked: false, disliked: false, viewed: false };
  const snap = await getDoc(doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId, 'userInteractions', uid));
  return snap.exists()
    ? { liked: false, disliked: false, viewed: false, ...snap.data() }
    : { liked: false, disliked: false, viewed: false };
};

export const toggleWorshipLike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextLiked = !current.liked;
    const wasDisliked = current.disliked === true;

    tx.set(
      interactionRef,
      { liked: nextLiked, disliked: false, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      likes: increment(nextLiked ? 1 : -1),
      ...(wasDisliked ? { dislikes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextLiked;
  });
};

export const toggleWorshipDislike = async (contentId, uid) => {
  if (!contentId || !uid) throw new Error('Missing content or user id');
  const contentRef = doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId, 'userInteractions', uid);
  return runTransaction(db, async (tx) => {
    const interactionSnap = await tx.get(interactionRef);
    const current = interactionSnap.exists()
      ? interactionSnap.data()
      : { liked: false, disliked: false, viewed: false };
    const nextDisliked = !current.disliked;
    const wasLiked = current.liked === true;

    tx.set(
      interactionRef,
      { liked: false, disliked: nextDisliked, viewed: current.viewed === true, updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.update(contentRef, {
      dislikes: increment(nextDisliked ? 1 : -1),
      ...(wasLiked ? { likes: increment(-1) } : {}),
      updatedAt: serverTimestamp(),
    });
    return nextDisliked;
  });
};

export const registerWorshipView = async (contentId, uid) => {
  if (!contentId || !uid) return;
  const contentRef = doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId);
  const interactionRef = doc(db, COLLECTIONS.WORSHIP_CONTENT, contentId, 'userInteractions', uid);
  try {
    await runTransaction(db, async (tx) => {
      const interactionSnap = await tx.get(interactionRef);
      const current = interactionSnap.exists()
        ? interactionSnap.data()
        : { liked: false, disliked: false, viewed: false };
      if (current.viewed === true) return;
      tx.set(
        interactionRef,
        { liked: current.liked === true, disliked: current.disliked === true, viewed: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      tx.update(contentRef, { views: increment(1), updatedAt: serverTimestamp() });
    });
  } catch (err) {
    console.warn('[registerWorshipView] failed:', err?.message);
  }
};

export const subscribeToSavedWorshipContent = (uid, onData, onError) => {
  if (!uid) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTIONS.USERS, uid, 'savedWorshipContent'), orderBy('savedAt', 'desc'));
  return safeOnSnapshot(q, onData, onError);
};

export const isWorshipContentSaved = async (uid, contentId) => {
  if (!uid || !contentId) return false;
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid, 'savedWorshipContent', contentId));
  return snap.exists();
};

export const toggleSaveWorshipContent = async (uid, content) => {
  if (!uid || !content?.id) throw new Error('Missing user or content');
  const ref = doc(db, COLLECTIONS.USERS, uid, 'savedWorshipContent', content.id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    contentId: content.id,
    title: content.title || '',
    thumbnail: content.thumbnail || '',
    type: content.type || '',
    savedAt: serverTimestamp(),
  });
  return true;
};

// ─── User-Submitted Prayers ─────────────────────────────────────────────────
// Users create prayers; admins approve/reject. Status defaults to PENDING.
// Firestore rules enforce userId matching, status on create, and admin-only updates.

/** Real-time listener for prayers submitted by this user */
export const subscribeToMyUserPrayers = (uid, onData, onError) => {
  if (!uid) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTIONS.USER_PRAYERS),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return safeOnSnapshot(q, onData, onError);
};

/** Submit a new user prayer. Returns the new doc with id. */
export const createUserPrayer = async (payload) => {
  if (!payload?.userId) throw new Error('Missing user id');
  if (!payload?.title?.trim()) throw new Error('Prayer title is required');
  if (!payload?.content?.trim()) throw new Error('Prayer content is required');
  if (!payload?.category) throw new Error('Please select a category');

  const docRef = await addDoc(collection(db, COLLECTIONS.USER_PRAYERS), {
    title: String(payload.title).trim(),
    description: String(payload.description || '').trim(),
    category: String(payload.category),
    content: String(payload.content).trim(),
    anonymous: payload.anonymous === true,
    status: 'pending',
    userId: String(payload.userId),
    username: String(payload.username || '').trim(),
    prayCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    deviceTimestamp: Date.now(),
  });
  const snap = await getDoc(docRef);
  return { id: docRef.id, ...snap.data() };
};

/** Delete one of my own prayers (owner-only on the server via rules). */
export const deleteMyUserPrayer = async (id, uid) => {
  if (!id || !uid) throw new Error('Missing prayer or user id');
  await deleteDoc(doc(db, COLLECTIONS.USER_PRAYERS, id));
};

// ─── Community Prayer Requests (Prayer Room → approved userPrayers) ────────
// Same `userPrayers` collection as "Write a Prayer" above — once an admin
// approves a submission (status: 'approved'), it becomes readable by every
// authenticated user and appears in the Prayer Room's Community section.
// "I'm Praying" + comments reuse the exact same transaction + subcollection
// pattern as toggleVideoLike/registerVideoView above, just scoped to this
// doc instead of a witnessVideos doc.

/** Real-time listener for every approved community prayer request. */
export const subscribeToApprovedUserPrayers = (onData, onError) => {
  const q = query(
    collection(db, COLLECTIONS.USER_PRAYERS),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return safeOnSnapshot(q, onData, onError);
};

/** Whether the given user has already tapped "I'm Praying" for this request. */
export const getMyPrayingState = async (prayerId, uid) => {
  if (!prayerId || !uid) return false;
  const snap = await getDoc(doc(db, COLLECTIONS.USER_PRAYERS, prayerId, 'prayingUsers', uid));
  return snap.exists() && snap.data()?.praying === true;
};

/**
 * Toggle "I'm Praying" for a request (mirrors toggleVideoLike: a per-user
 * subcollection doc records this user's state, and the parent doc's
 * `prayCount` is nudged by exactly ±1 in the same transaction so the
 * count and the button state can never drift apart). Returns the new state.
 */
export const togglePrayingForRequest = async (prayerId, uid) => {
  if (!prayerId || !uid) throw new Error('Missing prayer or user id');
  const prayerRef = doc(db, COLLECTIONS.USER_PRAYERS, prayerId);
  const prayingRef = doc(db, COLLECTIONS.USER_PRAYERS, prayerId, 'prayingUsers', uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(prayingRef);
    const current = snap.exists() && snap.data()?.praying === true;
    const next = !current;
    tx.set(prayingRef, { praying: next, updatedAt: serverTimestamp() }, { merge: true });
    tx.update(prayerRef, {
      prayCount: increment(next ? 1 : -1),
      updatedAt: serverTimestamp(),
    });
    return next;
  });
};

/** Real-time listener for a request's encouraging comments, oldest first. */
export const subscribeToPrayerComments = (prayerId, onData, onError) => {
  if (!prayerId) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTIONS.USER_PRAYERS, prayerId, 'comments'),
    orderBy('createdAt', 'asc'),
    limit(200)
  );
  return safeOnSnapshot(q, onData, onError);
};

/** Post an encouraging comment on a community prayer request. */
export const addPrayerComment = async (prayerId, { userId, username, text } = {}) => {
  if (!prayerId || !userId) throw new Error('Missing prayer or user id');
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('Please write a comment');
  if (trimmed.length > 500) throw new Error('Comment must be 500 characters or fewer');

  const prayerRef = doc(db, COLLECTIONS.USER_PRAYERS, prayerId);
  const commentRef = doc(collection(db, COLLECTIONS.USER_PRAYERS, prayerId, 'comments'));
  await runTransaction(db, async (tx) => {
    tx.set(commentRef, {
      userId: String(userId),
      username: String(username || 'Believer').trim(),
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    tx.update(prayerRef, {
      commentCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  });
};
