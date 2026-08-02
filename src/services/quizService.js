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
  savePendingSubmission,
  getPendingSubmission,
  clearPendingSubmission,
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
  const displayName = userDisplay?.name || 'Player';
  const photoURL = userDisplay?.photoURL || '';

  let resultProfile;
  let newlyUnlocked = [];
  let rankContext = { reachedTop10: false };
  // Set inside the transaction if this exact sessionId was already marked
  // completed — by an earlier successful call, OR by a concurrent call that
  // committed first. The read of sessionRef and the write to it both happen
  // inside this single transaction, so two near-simultaneous submits of the
  // same session (double-tap, a retried failed request that actually landed,
  // a background pending-submission flush racing a live one) can no longer
  // both observe "not completed yet" and both award XP/streak/leaderboard
  // credit. Firestore serializes conflicting transactions: whichever commits
  // second re-runs and sees the first one's write, landing in this branch
  // instead of double-crediting the user.
  let alreadyCompletedData = null;

  await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (sessionSnap.exists() && sessionSnap.data()?.status === 'completed') {
      alreadyCompletedData = sessionSnap.data();
      return;
    }

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

  if (alreadyCompletedData) {
    // Return the SAME shape as a fresh submission (score/accuracy/profile at
    // the top level, not nested under `result`) so callers like
    // QuizResultScreen don't need special-case handling for a duplicate
    // resubmit, and show the actual saved score instead of falling back to
    // a client-estimated one.
    const profile = await getQuizProfile(uid);
    return {
      score: alreadyCompletedData.score,
      accuracy: alreadyCompletedData.accuracy,
      completionTimeMs: alreadyCompletedData.completionTimeMs,
      correctCount: alreadyCompletedData.correctCount,
      wrongCount: alreadyCompletedData.wrongCount,
      totalQuestions: alreadyCompletedData.totalQuestions,
      profile,
      newlyUnlocked: [],
      duplicate: true,
    };
  }

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

  // The leaderboard upsert (across all 4 periods) IS awaited here, unlike
  // the rest of this function's Firestore writes: it's the one write that
  // directly determines what the Leaderboard screen shows, so the screen
  // the user lands on next (or the Leaderboard they tap into from the
  // Result screen) must never race ahead of it. A failure here is still
  // swallowed rather than surfaced as a failed quiz submission — the score
  // itself is already safely saved above — but we no longer return before
  // the write we know the very next screen depends on has settled, and the
  // failure is now LOGGED (not silently dropped) so a permission or index
  // problem is visible in device/Metro logs instead of just "leaderboard
  // looks wrong" with no trace of why.
  try {
    await upsertLeaderboardEntries(uid, leaderboardEntry);
  } catch (err) {
    console.error(
      '❌ [Leaderboard] upsertLeaderboardEntries failed — this quiz result will NOT appear on the leaderboard. code:',
      err?.code,
      'message:',
      err?.message
    );
  }

  // The top-10 "reachedTop10" achievement flag is a secondary side effect —
  // it doesn't affect what the leaderboard itself displays, so it's safe to
  // resolve in the background without delaying the Result screen further.
  syncTop10AchievementInBackground(uid, resultProfile);

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

// ─── Durable submission (survives lost network / killed app) ───────────────
//
// submitQuizSession() above is the pure "talk to Firestore" operation. These
// two wrappers add local-storage bookkeeping around it so a completed quiz's
// result is never silently lost:
//
// 1. submitQuizSessionDurable — what the Result screen calls. Persists the
//    full submission payload to disk BEFORE attempting the network call, and
//    only erases that local record once submitQuizSession has actually
//    resolved. If the app is killed, backgrounded past its network budget,
//    or the request just fails, the payload is still sitting on disk.
// 2. flushPendingQuizSubmission — a best-effort "finish what we started"
//    call. Looks for a leftover payload from a previous attempt and retries
//    it. Safe to call opportunistically (e.g. on Quiz Home mount) since the
//    duplicate guard inside submitQuizSession makes a repeat submit of an
//    already-completed session a cheap no-op rather than a double credit.
export const submitQuizSessionDurable = async (uid, sessionPayload, userDisplay) => {
  if (uid) {
    await savePendingSubmission(uid, { sessionPayload, userDisplay });
  }
  const result = await submitQuizSession(uid, sessionPayload, userDisplay);
  if (uid) {
    await clearPendingSubmission(uid);
  }
  return result;
};

export const flushPendingQuizSubmission = async (uid) => {
  if (!uid) return null;
  const pending = await getPendingSubmission(uid);
  if (!pending?.sessionPayload) return null;
  try {
    const result = await submitQuizSession(uid, pending.sessionPayload, pending.userDisplay);
    await clearPendingSubmission(uid);
    return result;
  } catch (err) {
    // Still no luck (still offline, etc.) — leave the pending record in
    // place so the next opportunity (app reopen, Quiz Home revisit, manual
    // retry from the Result screen) can try again.
    console.warn(
      '\u26a0\ufe0f [Quiz] flushPendingQuizSubmission failed, will retry later. code:',
      err?.code,
      'message:',
      err?.message
    );
    return null;
  }
};

const syncTop10AchievementInBackground = (uid, resultProfile) => {
  fetchUserLeaderboardRank(uid, 'daily')
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
  const results = await Promise.allSettled(
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
  // Promise.all would reject on the first failing period and abort silently
  // for the rest; Promise.allSettled lets every period attempt independently
  // (a 'daily' failure shouldn't stop 'alltime' from writing) while still
  // logging exactly which period(s) failed and why, instead of one opaque
  // rejection with no indication of which of the 4 writes was the problem.
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason;
      console.error(
        `\u274c [Leaderboard] upsert failed for period "${periods[i]}". code:`,
        err?.code,
        'message:',
        err?.message
      );
    }
  });
  if (results.every((r) => r.status === 'rejected')) {
    // Every period failed the same way (e.g. all permission-denied) —
    // surface one representative error so the caller's catch block (and
    // its own logging) still fires.
    throw results[0].reason;
  }
};

// How many docs the single-field fallback pulls before ranking client-side.
// Needs to comfortably exceed any realistic limitCount so tie-breaking
// (accuracy, then time) never gets truncated away from the real top scorers.
const LEADERBOARD_FALLBACK_SAMPLE_SIZE = 500;

const rankEntries = (docs, limitCount) => {
  const entries = docs.map((d) => ({ id: d.id, ...d.data() }));
  entries.sort(compareLeaderboardEntries);
  return entries.slice(0, limitCount).map((e, i) => ({ ...e, rank: i + 1 }));
};

export const fetchLeaderboard = async (period = 'daily', limitCount = 50) => {
  const periodKey = getLeaderboardPeriodKey(period);
  const boardId = `${period}_${periodKey}`;
  const ref = collection(db, QUIZ_COLLECTIONS.LEADERBOARDS, boardId, 'entries');

  // Preferred path: fully server-ordered by score then accuracy. Requires a
  // composite index on (score desc, accuracy desc) for the `entries`
  // collection group — see firestore.indexes.json.
  try {
    const snap = await getDocs(
      query(ref, orderBy('score', 'desc'), orderBy('accuracy', 'desc'), limit(limitCount))
    );
    return rankEntries(snap.docs, limitCount);
  } catch (err) {
    console.warn(
      `\u26a0\ufe0f [Leaderboard] indexed query failed for board "${boardId}", falling back. code:`,
      err?.code,
      'message:',
      err?.message
    );
  }

  // Fallback: order by 'score' alone (single-field indexes are automatic in
  // Firestore, no composite index required), over a wide-enough sample that
  // the true top scorers are never excluded, then finish the tie-break
  // (accuracy, then completion time) client-side.
  try {
    const snap = await getDocs(
      query(ref, orderBy('score', 'desc'), limit(LEADERBOARD_FALLBACK_SAMPLE_SIZE))
    );
    return rankEntries(snap.docs, limitCount);
  } catch (err) {
    console.warn(
      `\u26a0\ufe0f [Leaderboard] single-field fallback failed for board "${boardId}", falling back further. code:`,
      err?.code,
      'message:',
      err?.message
    );
  }

  // Last resort: unordered fetch. Only reliable when the period has fewer
  // entries than the sample size, but better than surfacing a hard error.
  try {
    const snap = await getDocs(query(ref, limit(LEADERBOARD_FALLBACK_SAMPLE_SIZE)));
    return rankEntries(snap.docs, limitCount);
  } catch (err) {
    // If even a plain, unordered, un-filtered read of the collection fails,
    // this is almost certainly NOT a missing-index problem (that only
    // affects orderBy queries) — it's a rules/auth/connectivity problem.
    // Re-throw with the code intact so useLeaderboard can show something
    // more useful than a generic "failed to load".
    console.error(
      `\u274c [Leaderboard] ALL fetch strategies failed for board "${boardId}". code:`,
      err?.code,
      'message:',
      err?.message,
      err?.code === 'permission-denied'
        ? '\u2014 check that firestore.rules has been DEPLOYED (not just committed) to the live Firebase project.'
        : ''
    );
    throw err;
  }
};

export const fetchUserLeaderboardRank = async (uid, period = 'daily') => {
  const entries = await fetchLeaderboard(period, 100);
  const idx = entries.findIndex((e) => e.uid === uid);
  return idx >= 0 ? idx + 1 : null;
};
