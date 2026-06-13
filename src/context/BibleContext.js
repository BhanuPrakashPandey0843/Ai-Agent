import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  getBibleSettings,
  saveBibleSettings,
  getContinueReading,
  saveContinueReading,
  getBookmarks,
  toggleBookmark as storageToggleBookmark,
  getNotes,
  saveNote,
  deleteNote,
  getStreak,
  recordReadingActivity,
  recordListeningActivity,
  getPlanProgress,
  updatePlanProgress,
  getHighlights,
  saveHighlight,
} from '../storage/bibleStorage';
import { fetchChapter } from '../services/bibleService';
import { getDailyVerse, READING_THEMES } from '../constants/bible';

const BibleContext = createContext(null);

export function BibleProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [continueReading, setContinueReading] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [highlights, setHighlights] = useState({});
  const [streak, setStreak] = useState(null);
  const [planProgress, setPlanProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [audio, setAudio] = useState({
    playing: false,
    paused: false,
    reference: '',
    speed: 1,
    sleepMinutes: null,
  });
  const speechQueue = useRef([]);
  const sleepTimerRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, cr, bm, nt, hl, st, plans] = await Promise.all([
        getBibleSettings(),
        getContinueReading(),
        getBookmarks(),
        getNotes(),
        getHighlights(),
        getStreak(),
        getPlanProgress(),
      ]);
      setSettings(s);
      setContinueReading(cr);
      setBookmarks(bm);
      setNotes(nt);
      setHighlights(hl);
      setStreak(st);
      setPlanProgress(plans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateSettings = useCallback(async (patch) => {
    const next = { ...(settings || {}), ...patch };
    setSettings(next);
    await saveBibleSettings(next);
  }, [settings]);

  const readerTheme = useMemo(() => {
    const themeId = settings?.themeId || 'light';
    return READING_THEMES[themeId] || READING_THEMES.light;
  }, [settings?.themeId]);

  const dailyVerse = useMemo(() => getDailyVerse(), []);

  const resumeReading = useCallback(async () => {
    if (!continueReading) return null;
    return fetchChapter(continueReading.bookId, continueReading.chapter);
  }, [continueReading]);

  const trackReading = useCallback(async (bookId, chapter, verse = 1) => {
    const payload = { bookId, chapter, verse };
    setContinueReading(payload);
    await saveContinueReading(payload);
    const nextStreak = await recordReadingActivity();
    setStreak(nextStreak);
  }, []);

  const toggleBookmark = useCallback(async (bookmark) => {
    await storageToggleBookmark(bookmark);
    const bm = await getBookmarks();
    setBookmarks(bm);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return bm;
  }, []);

  const upsertNote = useCallback(async (note) => {
    const updated = await saveNote(note);
    setNotes(updated);
    return updated;
  }, []);

  const removeNote = useCallback(async (id) => {
    const updated = await deleteNote(id);
    setNotes(updated);
    return updated;
  }, []);

  const highlightVerse = useCallback(async (bookId, chapter, verse, color) => {
    const hl = await saveHighlight(bookId, chapter, verse, color);
    setHighlights(hl);
    await Haptics.selectionAsync();
  }, []);

  const completePlanDay = useCallback(async (planId, day) => {
    const plans = await updatePlanProgress(planId, day);
    setPlanProgress(plans);
    return plans;
  }, []);

  const stopAudio = useCallback(() => {
    Speech.stop();
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    speechQueue.current = [];
    setAudio((prev) => ({ ...prev, playing: false, paused: false, reference: '' }));
  }, []);

  const speakNext = useCallback((speed) => {
    if (!speechQueue.current.length) {
      setAudio((prev) => ({ ...prev, playing: false, paused: false }));
      return;
    }
    const line = speechQueue.current.shift();
    Speech.speak(line.text, {
      rate: speed,
      onDone: () => speakNext(speed),
      onStopped: () => {},
      onError: () => speakNext(speed),
    });
  }, []);

  const playChapterAudio = useCallback(async (bookId, chapter, speed = 1) => {
    stopAudio();
    const chapterData = await fetchChapter(bookId, chapter);
    speechQueue.current = chapterData.verses.map(
      (v) => ({ text: `Verse ${v.number}. ${v.text}` })
    );
    setAudio({
      playing: true,
      paused: false,
      reference: chapterData.reference,
      speed,
      sleepMinutes: null,
    });
    await recordListeningActivity();
    const st = await getStreak();
    setStreak(st);
    speakNext(speed);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [speakNext, stopAudio]);

  const pauseAudio = useCallback(() => {
    Speech.pause();
    setAudio((prev) => ({ ...prev, paused: true }));
  }, []);

  const resumeAudio = useCallback(() => {
    Speech.resume();
    setAudio((prev) => ({ ...prev, paused: false }));
  }, []);

  const setAudioSpeed = useCallback((speed) => {
    setAudio((prev) => ({ ...prev, speed }));
    if (audio.playing) {
      stopAudio();
    }
  }, [audio.playing, stopAudio]);

  const setSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setAudio((prev) => ({ ...prev, sleepMinutes: minutes }));
    if (minutes) {
      sleepTimerRef.current = setTimeout(() => stopAudio(), minutes * 60 * 1000);
    }
  }, [stopAudio]);

  const value = useMemo(
    () => ({
      loading,
      settings,
      readerTheme,
      continueReading,
      bookmarks,
      notes,
      highlights,
      streak,
      planProgress,
      dailyVerse,
      audio,
      loadAll,
      updateSettings,
      trackReading,
      resumeReading,
      toggleBookmark,
      upsertNote,
      removeNote,
      highlightVerse,
      completePlanDay,
      playChapterAudio,
      pauseAudio,
      resumeAudio,
      stopAudio,
      setAudioSpeed,
      setSleepTimer,
    }),
    [
      loading,
      settings,
      readerTheme,
      continueReading,
      bookmarks,
      notes,
      highlights,
      streak,
      planProgress,
      dailyVerse,
      audio,
      loadAll,
      updateSettings,
      trackReading,
      resumeReading,
      toggleBookmark,
      upsertNote,
      removeNote,
      highlightVerse,
      completePlanDay,
      playChapterAudio,
      pauseAudio,
      resumeAudio,
      stopAudio,
      setAudioSpeed,
      setSleepTimer,
    ]
  );

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
}

export function useBible() {
  const ctx = useContext(BibleContext);
  if (!ctx) throw new Error('useBible must be used within BibleProvider');
  return ctx;
}
