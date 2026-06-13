import { storeJSON, getJSON, removeItem } from './index';

const KEYS = {
  PROGRESS: 'faithframes_bible_progress',
  BOOKMARKS: 'faithframes_bible_bookmarks',
  NOTES: 'faithframes_bible_notes',
  HIGHLIGHTS: 'faithframes_bible_highlights',
  SETTINGS: 'faithframes_bible_settings',
  STREAK: 'faithframes_bible_streak',
  PLANS: 'faithframes_bible_plans',
  CHAPTER_CACHE: 'faithframes_bible_chapter_cache',
  RECENT_SEARCHES: 'faithframes_bible_recent_searches',
  PRAYERS: 'faithframes_bible_prayers',
};

const defaultSettings = () => ({
  fontSize: 18,
  fontFamily: 'system',
  themeId: 'light',
  lineHeight: 1.6,
});

const defaultStreak = () => ({
  readingStreak: 0,
  listeningStreak: 0,
  bestReading: 0,
  bestListening: 0,
  lastReadDate: null,
  lastListenDate: null,
});

export const getBibleSettings = async () => (await getJSON(KEYS.SETTINGS)) || defaultSettings();
export const saveBibleSettings = async (settings) =>
  storeJSON(KEYS.SETTINGS, { ...defaultSettings(), ...settings });

export const getContinueReading = async () => {
  const progress = (await getJSON(KEYS.PROGRESS)) || {};
  return progress.continueReading || null;
};

export const saveContinueReading = async (payload) => {
  const progress = (await getJSON(KEYS.PROGRESS)) || {};
  await storeJSON(KEYS.PROGRESS, {
    ...progress,
    continueReading: { ...payload, updatedAt: Date.now() },
  });
};

export const getBookmarks = async () => (await getJSON(KEYS.BOOKMARKS)) || [];
export const saveBookmarks = async (bookmarks) => storeJSON(KEYS.BOOKMARKS, bookmarks);

export const toggleBookmark = async (bookmark) => {
  const bookmarks = await getBookmarks();
  const key = `${bookmark.bookId}_${bookmark.chapter}_${bookmark.verse || 0}`;
  const exists = bookmarks.find((b) => b.key === key);
  if (exists) {
    await saveBookmarks(bookmarks.filter((b) => b.key !== key));
    return false;
  }
  await saveBookmarks([{ ...bookmark, key, createdAt: Date.now() }, ...bookmarks]);
  return true;
};

export const isBookmarked = async (bookId, chapter, verse = 0) => {
  const bookmarks = await getBookmarks();
  const key = `${bookId}_${chapter}_${verse || 0}`;
  return bookmarks.some((b) => b.key === key);
};

export const getNotes = async () => (await getJSON(KEYS.NOTES)) || [];
export const saveNote = async (note) => {
  const notes = await getNotes();
  const existing = notes.findIndex((n) => n.id === note.id);
  if (existing >= 0) {
    notes[existing] = { ...notes[existing], ...note, updatedAt: Date.now() };
  } else {
    notes.unshift({ ...note, id: note.id || `${Date.now()}`, createdAt: Date.now() });
  }
  await storeJSON(KEYS.NOTES, notes);
  return notes;
};

export const deleteNote = async (id) => {
  const notes = (await getNotes()).filter((n) => n.id !== id);
  await storeJSON(KEYS.NOTES, notes);
  return notes;
};

export const getHighlights = async () => (await getJSON(KEYS.HIGHLIGHTS)) || {};
export const saveHighlight = async (bookId, chapter, verse, color = '#FFE082') => {
  const highlights = await getHighlights();
  const key = `${bookId}_${chapter}_${verse}`;
  highlights[key] = { color, updatedAt: Date.now() };
  await storeJSON(KEYS.HIGHLIGHTS, highlights);
  return highlights;
};

export const getStreak = async () => (await getJSON(KEYS.STREAK)) || defaultStreak();

const todayKey = () => new Date().toISOString().slice(0, 10);

export const recordReadingActivity = async () => {
  const streak = await getStreak();
  const today = todayKey();
  if (streak.lastReadDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  let readingStreak = streak.readingStreak || 0;
  if (streak.lastReadDate === yKey) readingStreak += 1;
  else readingStreak = 1;

  const next = {
    ...streak,
    readingStreak,
    bestReading: Math.max(streak.bestReading || 0, readingStreak),
    lastReadDate: today,
  };
  await storeJSON(KEYS.STREAK, next);
  return next;
};

export const recordListeningActivity = async () => {
  const streak = await getStreak();
  const today = todayKey();
  if (streak.lastListenDate === today) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  let listeningStreak = streak.listeningStreak || 0;
  if (streak.lastListenDate === yKey) listeningStreak += 1;
  else listeningStreak = 1;

  const next = {
    ...streak,
    listeningStreak,
    bestListening: Math.max(streak.bestListening || 0, listeningStreak),
    lastListenDate: today,
  };
  await storeJSON(KEYS.STREAK, next);
  return next;
};

export const getPlanProgress = async () => (await getJSON(KEYS.PLANS)) || {};
export const updatePlanProgress = async (planId, dayCompleted) => {
  const plans = await getPlanProgress();
  const current = plans[planId] || { completedDays: [], startedAt: Date.now() };
  if (!current.completedDays.includes(dayCompleted)) {
    current.completedDays = [...current.completedDays, dayCompleted].sort((a, b) => a - b);
  }
  plans[planId] = current;
  await storeJSON(KEYS.PLANS, plans);
  return plans;
};

export const getCachedChapter = async (cacheKey) => {
  const cache = (await getJSON(KEYS.CHAPTER_CACHE)) || {};
  const entry = cache[cacheKey];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > 1000 * 60 * 60 * 24 * 30) return null;
  return entry.data;
};

export const cacheChapter = async (cacheKey, data) => {
  const cache = (await getJSON(KEYS.CHAPTER_CACHE)) || {};
  cache[cacheKey] = { data, cachedAt: Date.now() };
  await storeJSON(KEYS.CHAPTER_CACHE, cache);
};

export const getRecentSearches = async () => (await getJSON(KEYS.RECENT_SEARCHES)) || [];
export const addRecentSearch = async (query) => {
  if (!query?.trim()) return [];
  const recent = (await getRecentSearches()).filter((q) => q !== query.trim());
  recent.unshift(query.trim());
  await storeJSON(KEYS.RECENT_SEARCHES, recent.slice(0, 10));
  return recent.slice(0, 10);
};

export const getPrayers = async () => (await getJSON(KEYS.PRAYERS)) || [];
export const savePrayer = async (prayer) => {
  const prayers = await getPrayers();
  prayers.unshift({ ...prayer, id: prayer.id || `${Date.now()}`, createdAt: Date.now() });
  await storeJSON(KEYS.PRAYERS, prayers);
  return prayers;
};

export const clearBibleCache = async () => removeItem(KEYS.CHAPTER_CACHE);
