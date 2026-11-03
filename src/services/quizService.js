import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Env } from '../config/env';
import { COLLECTIONS } from '../constants';
import { QUIZ_COLLECTIONS, QUIZ_TYPES } from '../constants/quiz';
import { isValidQuizQuestion, normalizeQuestion } from './quizEngine';
import { compareLeaderboardEntries } from '../utils/quizScoring';
import { getLeaderboardPeriodKey } from '../utils/quizDates';
import {
  saveQuestionCache,
  getQuestionCache,
  saveAttemptedCache,
  getAttemptedCache,
  getAttemptedCacheMeta,
  getGuestQuizHistory,
  saveGuestQuizHistory,
  savePendingSubmission,
  getPendingSubmission,
  clearPendingSubmission,
} from '../storage/quizStorage';

const QUESTIONS_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const QUIZ_API_TIMEOUT_MS = 20000;

const callQuizApi = async (action, data = {}) => {
  const token = await auth.currentUser?.getIdToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUIZ_API_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${Env.quizApiBaseUrl}/api/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, data }),
      signal: controller.signal,
    });
  } catch (err) {
    // fetch() rejects (no HTTP status at all) on timeouts, offline, DNS/TLS
    // failures, and - in browsers - CORS/preflight rejections. Surface a
    // readable message instead of the bare "Failed to fetch"/"Network request failed".
    console.warn(`[Quiz] ${action} request to ${Env.quizApiBaseUrl}/api/quiz failed:`, err?.name, err?.message);
    throw new Error(
      err?.name === 'AbortError'
        ? 'The quiz server took too long to respond. Please try again.'
        : 'Could not reach the quiz server. Check your connection and try again.'
    );
  } finally {
    clearTimeout(timer);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Quiz request failed (${response.status}).`);
  }
  return result;
};

// In-memory catalogs so Quiz Home → Start quiz doesn't re-read AsyncStorage
// or hit Firestore again within the same app session.
const memQuestions = new Map();
const memAttempted = new Map();

const uniqueQuestions = (questions) => {
  const seen = new Set();
  return (questions || []).filter((q) => {
    if (!q?.id || seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
};

// Small backward buffer applied to the incremental attempted-questions sync
// cursor, to absorb clock skew between the client's local clock (used to
// stamp the cache) and the Firestore server clock (used to stamp
// `attemptedAt`). Re-fetching a few extra minutes of docs is harmless since
// merging into a Set is idempotent; the buffer just protects against ever
// missing a doc because of skew.
const ATTEMPTED_SYNC_SKEW_BUFFER_MS = 5 * 60 * 1000;

export const fetchAllQuestionsFromFirestore = async () => {
  const result = await callQuizApi('getQuizQuestions');
  return uniqueQuestions(
    (result.questions || [])
      .map((question) => normalizeQuestion(question))
      .filter(isValidQuizQuestion)
  );
};

export const fetchQuizCatalog = async (forceRefresh = false) => {
  return callQuizApi('getQuizCatalog', { forceRefresh });
};

export const getQuestionsCatalog = async (uid, { forceRefresh = false } = {}) => {
  const cacheUid = uid || 'guest';
  if (!forceRefresh) {
    const mem = memQuestions.get(cacheUid);
    if (mem?.questions?.length && Date.now() - mem.cachedAt < QUESTIONS_CACHE_TTL_MS) {
      return mem.questions;
    }
    const cached = await getQuestionCache(uid);
    if (cached?.questions?.length && Date.now() - cached.cachedAt < QUESTIONS_CACHE_TTL_MS) {
      const valid = uniqueQuestions(
        cached.questions
          .map((question) => normalizeQuestion(question))
          .filter(isValidQuizQuestion)
          .map(({ correctIndex, correctAnswer, ...question }) => question)
      );
      memQuestions.set(cacheUid, { questions: valid, cachedAt: cached.cachedAt });
      return valid;
    }
  }

  const questions = uniqueQuestions(await fetchAllQuestionsFromFirestore());
  const payload = { questions, cachedAt: Date.now() };
  memQuestions.set(cacheUid, payload);
  await saveQuestionCache(uid, payload);
  return questions;
};

export const fetchAttemptedQuestionIds = async (uid) => {
  if (!uid) return getAttemptedCache(null);

  const mem = memAttempted.get(uid);
  const { ids: local, syncedAt } = mem
    ? { ids: mem.ids, syncedAt: mem.syncedAt }
    : await getAttemptedCacheMeta(uid);
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
    const nextMeta = { ids: merged, syncedAt: Date.now() };
    memAttempted.set(uid, nextMeta);
    await saveAttemptedCache(uid, merged);
    return merged;
  } catch {
    memAttempted.set(uid, { ids: local, syncedAt: syncedAt || Date.now() });
    return local;
  }
};

export const prepareQuizSession = async (uid, quizTypeId) => {
  const quizType = QUIZ_TYPES[quizTypeId];
  if (!quizType) throw new Error('Unknown quiz type');

  const sessionId = `${uid || 'guest'}_${quizTypeId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let startedAt = Date.now();
  const clientHistory = uid ? null : await getGuestQuizHistory(quizTypeId);
  const started = await callQuizApi('startQuizSession', {
    sessionId,
    quizTypeId,
    ...(clientHistory ? { clientHistory } : {}),
  });
  startedAt = Number(started.startedAt) || startedAt;
  const questions = uniqueQuestions(
    (Array.isArray(started.questions) ? started.questions : [])
      .map((question) => normalizeQuestion(question))
      .filter(isValidQuizQuestion)
  );
  if (!questions.length) {
    throw new Error('The quiz server did not return any playable questions. Please try again.');
  }
  if (!uid && started.history) {
    await saveGuestQuizHistory(quizTypeId, started.history);
  }

  const session = {
    sessionId,
    quizTypeId,
    questionIds: questions.map((q) => q.id),
    questions,
    currentIndex: 0,
    answers: [],
    startedAt,
    status: 'active',
    serverRegistered: true,
  };

  return { session };
};

export const ensureQuizSessionStarted = async (session) => {
  if (!session?.sessionId || !session?.quizTypeId || !session?.questionIds?.length) {
    throw new Error('The saved quiz session is incomplete.');
  }
  const started = await callQuizApi('startQuizSession', {
    sessionId: session.sessionId,
    quizTypeId: session.quizTypeId,
    questionIds: session.questionIds,
  });
  let answers = session.answers || [];
  if (!session.serverRegistered) {
    answers = [];
    for (const savedAnswer of session.answers || []) {
      const recorded = await submitQuizAnswer(
        session.sessionId,
        savedAnswer.questionId,
        savedAnswer.selectedIndex
      );
      answers.push({ ...savedAnswer, ...recorded });
    }
  }
  return {
    startedAt: Number(started.startedAt) || session.startedAt || Date.now(),
    answers,
  };
};

export const submitQuizAnswer = async (sessionId, questionId, selectedIndex) => {
  return callQuizApi('answerQuizQuestion', { sessionId, questionId, selectedIndex });
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

export const submitQuizSession = async (uid, sessionPayload, userDisplay) => {
  if (!uid) throw new Error('Sign in to save quiz progress');
  const result = await callQuizApi('submitQuizSession', {
    sessionId: sessionPayload?.sessionId,
    quizTypeId: sessionPayload?.quizTypeId,
  });
  try {
    const attempted = await getAttemptedCache(uid);
    (sessionPayload?.answers || []).forEach((answer) => attempted.add(answer.questionId));
    await saveAttemptedCache(uid, attempted);
  } catch (err) {
    console.warn('[Quiz] Saved result but could not refresh the local attempted-question cache:', err?.message);
  }
  return result;
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

// How many docs the single-field fallback pulls before ranking client-side.
// Needs to comfortably exceed any realistic limitCount so tie-breaking
// (accuracy, then time) never gets truncated away from the real top scorers.
const LEADERBOARD_FALLBACK_SAMPLE_SIZE = 500;

const rankEntries = (docs, limitCount) => {
  const entries = docs.map((d) => ({ id: d.id, ...d.data() }));
  entries.sort(compareLeaderboardEntries);
  return entries.slice(0, limitCount).map((e, i) => ({ ...e, rank: i + 1 }));
};

const resolveLeaderboardProfiles = async (entries) => Promise.all(
  entries.map(async (entry) => {
    if (!entry.uid) return { ...entry, displayName: 'Player', photoURL: '' };
    const profile = await getDoc(doc(db, 'publicProfiles', entry.uid));
    const data = profile.exists() ? profile.data() : {};
    return {
      ...entry,
      displayName: typeof data.name === 'string' && data.name.trim()
        ? data.name.trim()
        : typeof entry.displayName === 'string' && entry.displayName.trim()
        ? entry.displayName.trim()
        : 'Player',
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : entry.photoURL || '',
    };
  })
);

export const fetchLeaderboard = async (period = 'daily', limitCount = 50) => {
  const periodKey = getLeaderboardPeriodKey(period);
  const boardId = `${period}_${periodKey}`;
  const ref = collection(db, QUIZ_COLLECTIONS.LEADERBOARDS, boardId, 'entries');

  // Preferred path: fully server-ordered by score then accuracy. Requires a
  // composite index on (score desc, accuracy desc) for the `entries`
  // collection group — see firestore.indexes.json.
  try {
    const snap = await getDocs(
      query(
        ref,
        orderBy('score', 'desc'),
        orderBy('accuracy', 'desc'),
        orderBy('completionTimeMs', 'asc'),
        limit(limitCount)
      )
    );
    return resolveLeaderboardProfiles(rankEntries(snap.docs, limitCount));
  } catch (err) {
    if (err?.code !== 'failed-precondition') throw err;
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
    return resolveLeaderboardProfiles(rankEntries(snap.docs, limitCount));
  } catch (err) {
    if (err?.code !== 'failed-precondition') throw err;
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
    return resolveLeaderboardProfiles(rankEntries(snap.docs, limitCount));
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
