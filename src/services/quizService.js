import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants';
import { QUIZ_COLLECTIONS, QUIZ_TYPES, XP_PER_CORRECT, XP_PER_QUIZ_COMPLETE } from '../constants/quiz';
import { isValidQuizQuestion, normalizeQuestion, selectQuestionsForSession } from './quizEngine';
import { computeAccuracy, computeSessionScore, compareLeaderboardEntries } from '../utils/quizScoring';
import { evaluateAchievements } from '../utils/achievements';
import { getLeaderboardPeriodKey, toDateKey } from '../utils/quizDates';
import {
  saveQuestionCache,
  getQuestionCache,
  saveAttemptedCache,
  getAttemptedCache,
  getAttemptedCacheMeta,
} from '../storage/quizStorage';

const QUESTIONS_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

// Small backward buffer applied to the incremental attempted-questions sync
// cursor, to absorb clock skew between the client's local clock (used to
// stamp the cache) and the Firestore server clock (used to stamp
// `attemptedAt`). Re-fetching a few extra minutes of docs is harmless since
// merging into a Set is idempotent; the buffer just protects against ever
// missing a doc because of skew.
const ATTEMPTED_SYNC_SKEW_BUFFER_MS = 5 * 60 * 1000;

const mapQuestionDocs = (docs) =>
  docs
    .map((d) => normalizeQuestion({ id: d.id, ...d.data() }))
    .filter(isValidQuizQuestion);

export const fetchAllQuestionsFromFirestore = async () => {
  const ref = collection(db, COLLECTIONS.QUESTIONS);
  try {
    const snap = await getDocs(query(ref, orderBy('createdAt', 'desc'), limit(500)));
    return mapQuestionDocs(snap.docs);
  } catch (err) {
    if (err?.code === 'failed-precondition') {
      const snap = await getDocs(query(ref, limit(500)));
      const items = mapQuestionDocs(snap.docs);
      return items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
    }
    throw err;
  }
};

export const getQuestionsCatalog = async (uid, { forceRefresh = false } = {}) => {
  if (!forceRefresh) {
    const cached = await getQuestionCache(uid);
    if (cached?.questions?.length && Date.now() - cached.cachedAt < QUESTIONS_CACHE_TTL_MS) {
      return cached.questions.filter(isValidQuizQuestion);
    }
  }

  const questions = await fetchAllQuestionsFromFirestore();
  await saveQuestionCache(uid, { questions, cachedAt: Date.now() });
  return questions;
};

export const fetchAttemptedQuestionIds = async (uid) => {
  if (!uid) return getAttemptedCache(null);

  const { ids: local, syncedAt } = await getAttemptedCacheMeta(uid);
  try {
    const attemptedRef = collection(db, COLLECTIONS.USERS, uid, QUIZ_COLLECTIONS.ATTEMPTED);
    // Incremental sync: once we have a local cache, only fetch attempts
    // recorded since the last sync (minus a small clock-skew buffer) instead
    // of the user's entire history every time. This keeps load time constant
    // as a user's total attempt history grows. The very first sync (no local
    // cache yet - fresh install, cleared storage, new device) still does one
    // full fetch, which then seeds the cache for every sync after that.
    const attemptedQuery = syncedAt
      ? query(attemptedRef, where('attemptedAt', '>', Timestamp.fromMillis(syncedAt - ATTEMPTED_SYNC_SKEW_BUFFER_MS)))
      : query(attemptedRef);
    const snap = await getDocs(attemptedQuery);
    const merged = new Set(local);
    snap.docs.forEach((d) => merged.add(d.id));
    await saveAttemptedCache(uid, merged);
    return merged;
  } catch {
    return local;
  }
};

export const prepareQuizSession = async (uid, quizTypeId) => {
  const quizType = QUIZ_TYPES[quizTypeId];
  if (!quizType) throw new Error('Unknown quiz type');

  const [allQuestions, attemptedIds] = await Promise.all([
    getQuestionsCatalog(uid),
    fetchAttemptedQuestionIds(uid),
  ]);

  const activeQuestions = allQuestions.filter((q) => q.active !== false && isValidQuizQuestion(q));
  if (!activeQuestions.length) {
    return {
      error: 'no_questions',
      message: 'No quiz questions available yet. Upload questions in the admin panel, then pull to refresh.',
    };
  }

  const matchingCount = activeQuestions.filter((q) =>
    quizType.categories.includes(q.category)
  ).length;

  const { questions, exhausted } = selectQuestionsForSession({
    allQuestions: activeQuestions,
    attemptedIds,
    quizTypeId,
    count: quizType.questionsCount,
    dateKey: toDateKey(),
  });

  if (exhausted || !questions.length) {
    if (matchingCount === 0) {
      return {
        error: 'no_questions',
        message: `No questions match "${quizType.label}" yet. Upload with categories: ${quizType.categories.join(', ')}.`,
      };
    }
    return {
      error: 'exhausted',
      message: 'You have completed all available questions for this quiz type.',
    };
  }

  const sessionId = `${uid || 'guest'}_${quizTypeId}_${Date.now()}`;
  const session = {
    sessionId,
    quizTypeId,
    questionIds: questions.map((q) => q.id),
    questions,
    currentIndex: 0,
    answers: [],
    startedAt: Date.now(),
    status: 'active',
  };

  return { session };
};

const defaultQuizProfile = () => ({
  xp: 0,
  level: 1,
  totalQuizzes: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  totalWrong: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  bestScore: 0,
  bestAccuracy: 0,
  fastestTimeMs: null,
  categoryStats: {},
  achievements: [],
  reachedTop10: false,
});

export const getQuizProfile = async (uid) => {
  if (!uid) return defaultQuizProfile();
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return defaultQuizProfile();
  return { ...defaultQuizProfile(), ...(snap.data()?.quizProfile || {}) };
};

const mergeCategoryStats = (prev, category, correct) => {
  const cat = prev[category] || { correct: 0, total: 0 };
  return {
    ...prev,
    [category]: {
      correct: cat.correct + (correct ? 1 : 0),
      total: cat.total + 1,
    },
  };
};

const updateStreak = (profile, todayKey) => {
  const last = profile.lastPlayedDate;
  let current = profile.currentStreak || 0;
  if (last === todayKey) {
    return { currentStreak: current, longestStreak: profile.longestStreak || 0 };
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = toDateKey(yesterday);
  if (last === yKey) {
    current += 1;
  } else {
    current = 1;
  }
  const longest = Math.max(profile.longestStreak || 0, current);
  return { currentStreak: current, longestStreak: longest, lastPlayedDate: todayKey };
};

export const submitQuizSession = async (uid, sessionPayload, userDisplay) => {
  if (!uid) throw new Error('Sign in to save quiz progress');

  const {
    sessionId,
    quizTypeId,
    answers,
    completionTimeMs,
    questions,
  } = sessionPayload;

  const correctCount = answers.filter((a) => a.correct).length;
  const wrongCount = answers.length - correctCount;
  const score = computeSessionScore(answers);
  const accuracy = computeAccuracy(correctCount, answers.length);
  const todayKey = toDateKey();

  const sessionRef = doc(db, COLLECTIONS.USERS, uid, QUIZ_COLLECTIONS.SESSIONS, sessionId);
  const existing = await getDoc(sessionRef);
  if (existing.exists() && existing.data()?.status === 'completed') {
    // Return the SAME shape as a fresh submission (score/accuracy/profile at
    // the top level, not nested under `result`) so callers like
    // QuizResultScreen don't need special-case handling for a duplicate
    // resubmit, and show the actual saved score instead of falling back to
    // a client-estimated one.
    const existingData = existing.data();
    const profile = await getQuizProfile(uid);
    return {
      score: existingData.score,
      accuracy: existingData.accuracy,
      completionTimeMs: existingData.completionTimeMs,
      correctCount: existingData.correctCount,
      wrongCount: existingData.wrongCount,
      totalQuestions: existingData.totalQuestions,
      profile,
      newlyUnlocked: [],
      duplicate: true,
    };
  }

  const displayName = userDisplay?.name || 'Player';
  const photoURL = userDisplay?.photoURL || '';

  let resultProfile;
  let newlyUnlocked = [];
  let rankContext = { reachedTop10: false };

  await runTransaction(db, async (tx) => {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await tx.get(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const profile = { ...defaultQuizProfile(), ...(userData.quizProfile || {}) };

    const streakUpdate = updateStreak(profile, todayKey);
    let categoryStats = { ...profile.categoryStats };
    answers.forEach((a) => {
      const q = questions.find((item) => item.id === a.questionId);
      if (q) categoryStats = mergeCategoryStats(categoryStats, q.category, a.correct);
    });

    const xpGain =
      correctCount * XP_PER_CORRECT + XP_PER_QUIZ_COMPLETE;
    const nextProfile = {
      ...profile,
      ...streakUpdate,
      xp: (profile.xp || 0) + xpGain,
      totalQuizzes: (profile.totalQuizzes || 0) + 1,
      totalQuestions: (profile.totalQuestions || 0) + answers.length,
      totalCorrect: (profile.totalCorrect || 0) + correctCount,
      totalWrong: (profile.totalWrong || 0) + wrongCount,
      categoryStats,
      bestScore: Math.max(profile.bestScore || 0, score),
      bestAccuracy: Math.max(profile.bestAccuracy || 0, accuracy),
      fastestTimeMs:
        profile.fastestTimeMs == null
          ? completionTimeMs
          : Math.min(profile.fastestTimeMs, completionTimeMs),
    };

    const achievementEval = evaluateAchievements(nextProfile, rankContext);
    nextProfile.achievements = achievementEval.achievements;
    newlyUnlocked = achievementEval.newlyUnlocked;

    tx.set(
      sessionRef,
      {
        sessionId,
        quizTypeId,
        score,
        accuracy,
        completionTimeMs,
        correctCount,
        wrongCount,
        totalQuestions: answers.length,
        answers,
        status: 'completed',
        submittedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      userRef,
      {
        quizProfile: nextProfile,
        lastScore: score,
        lastPlayed: new Date().toISOString(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    resultProfile = nextProfile;
  });

  const batch = writeBatch(db);
  answers.forEach((a) => {
    const ref = doc(db, COLLECTIONS.USERS, uid, QUIZ_COLLECTIONS.ATTEMPTED, a.questionId);
    batch.set(
      ref,
      {
        questionId: a.questionId,
        quizTypeId,
        correct: a.correct,
        attemptedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
  await batch.commit();

  const attempted = await getAttemptedCache(uid);
  answers.forEach((a) => attempted.add(a.questionId));
  await saveAttemptedCache(uid, attempted);

  const leaderboardEntry = {
    uid,
    displayName,
    photoURL,
    score,
    accuracy,
    completionTimeMs,
    correctCount,
    wrongCount,
    totalQuestions: answers.length,
    streak: resultProfile.currentStreak || 0,
    quizTypeId,
    sessionId,
    submittedAt: Date.now(),
  };

  // Everything below this point (leaderboard upserts across 4 periods, and
  // the top-10 rank check/flag) is NOT required for the score to be safely
  // saved - that already happened above via the transaction and the
  // attempted-questions batch. It runs in the background so the Result
  // screen can render immediately after this function returns, instead of
  // waiting on ~6 additional Firestore round trips. Errors here are
  // swallowed intentionally: they must never surface as a failed submission
  // to the user, matching the original code's own "non-blocking" intent.
  syncLeaderboardInBackground(uid, leaderboardEntry, resultProfile);

  return {
    score,
    accuracy,
    completionTimeMs,
    correctCount,
    wrongCount,
    totalQuestions: answers.length,
    profile: resultProfile,
    newlyUnlocked,
    duplicate: false,
  };
};

const syncLeaderboardInBackground = (uid, leaderboardEntry, resultProfile) => {
  upsertLeaderboardEntries(uid, leaderboardEntry)
    .then(() => fetchUserLeaderboardRank(uid, 'daily'))
    .then(async (dailyRank) => {
      if (dailyRank && dailyRank <= 10 && !resultProfile.reachedTop10) {
        await setDoc(
          doc(db, COLLECTIONS.USERS, uid),
          { quizProfile: { ...resultProfile, reachedTop10: true } },
          { merge: true }
        );
        resultProfile.reachedTop10 = true;
      }
    })
    .catch(() => {
      /* non-blocking background sync; safe to ignore, matches previous behavior */
    });
};

const shouldReplaceEntry = (existing, next) => {
  if (!existing) return true;
  return compareLeaderboardEntries(next, existing) < 0;
};

export const upsertLeaderboardEntries = async (uid, entry) => {
  const periods = ['daily', 'weekly', 'monthly', 'alltime'];
  await Promise.all(
    periods.map(async (period) => {
      const periodKey = getLeaderboardPeriodKey(period);
      const ref = doc(
        db,
        QUIZ_COLLECTIONS.LEADERBOARDS,
        `${period}_${periodKey}`,
        'entries',
        uid
      );
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : null;
      if (!shouldReplaceEntry(existing, entry)) return;
      await setDoc(
        ref,
        {
          ...entry,
          period,
          periodKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    })
  );
};

export const fetchLeaderboard = async (period = 'daily', limitCount = 50) => {
  const periodKey = getLeaderboardPeriodKey(period);
  const boardId = `${period}_${periodKey}`;
  const ref = collection(db, QUIZ_COLLECTIONS.LEADERBOARDS, boardId, 'entries');
  try {
    const snap = await getDocs(
      query(ref, orderBy('score', 'desc'), orderBy('accuracy', 'desc'), limit(limitCount))
    );
    let entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    entries.sort(compareLeaderboardEntries);
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  } catch {
    const snap = await getDocs(query(ref, limit(limitCount)));
    let entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    entries.sort(compareLeaderboardEntries);
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }
};

export const fetchUserLeaderboardRank = async (uid, period = 'daily') => {
  const entries = await fetchLeaderboard(period, 100);
  const idx = entries.findIndex((e) => e.uid === uid);
  return idx >= 0 ? idx + 1 : null;
};
