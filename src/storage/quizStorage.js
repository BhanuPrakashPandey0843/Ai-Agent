import { STORAGE_KEYS } from '../constants';
import { storeJSON, getJSON, removeItem } from './index';

const cacheKey = (uid) => `${STORAGE_KEYS.QUIZ_QUESTION_CACHE}_${uid || 'guest'}`;
const attemptedKey = (uid) => `${STORAGE_KEYS.QUIZ_ATTEMPTED_CACHE}_${uid || 'guest'}`;
// Active session is split into two records so that resuming/crash-recovery
// stays fully self-contained (the "shell" always carries the full question
// payload) while the frequently-written part of the session stays small:
// - shell: sessionId/quizTypeId/questionIds/questions/startedAt - written
//   ONCE per session, the first time it's persisted.
// - progress: currentIndex/answers/status - written on every answer/next tap.
const sessionShellKey = (uid) => `${STORAGE_KEYS.QUIZ_ACTIVE_SESSION}_shell_${uid || 'guest'}`;
const sessionProgressKey = (uid) => `${STORAGE_KEYS.QUIZ_ACTIVE_SESSION}_progress_${uid || 'guest'}`;
// A completed-but-not-yet-confirmed-saved submission. Written the instant
// the Result screen starts trying to save (before the network call), and
// only cleared once submitQuizSession has actually resolved successfully.
// This is what lets a failed upload (no signal, app killed mid-request,
// backgrounded and OS-killed, etc.) be retried later instead of the score
// silently vanishing — the whole point of "quiz submissions should always
// save successfully" even when the network doesn't cooperate.
const pendingSubmissionKey = (uid) => `${STORAGE_KEYS.QUIZ_PENDING_SUBMISSION}_${uid || 'guest'}`;

export const saveQuestionCache = async (uid, payload) => {
  await storeJSON(cacheKey(uid), {
    ...payload,
    cachedAt: Date.now(),
  });
};

export const getQuestionCache = async (uid) => getJSON(cacheKey(uid));

export const saveAttemptedCache = async (uid, attemptedIds) => {
  await storeJSON(attemptedKey(uid), {
    ids: Array.from(attemptedIds),
    syncedAt: Date.now(),
  });
};

export const getAttemptedCache = async (uid) => {
  const data = await getJSON(attemptedKey(uid));
  return new Set(data?.ids || []);
};

// Returns both the cached IDs and the timestamp of the last successful sync,
// so callers can fetch only what changed since then instead of the user's
// entire attempt history every time.
export const getAttemptedCacheMeta = async (uid) => {
  const data = await getJSON(attemptedKey(uid));
  return {
    ids: new Set(data?.ids || []),
    syncedAt: data?.syncedAt || null,
  };
};

export const saveActiveSession = async (uid, session) => {
  const { questions, questionIds, sessionId, quizTypeId, startedAt, ...progress } = session;
  const existingShell = await getJSON(sessionShellKey(uid));
  if (!existingShell || existingShell.sessionId !== sessionId) {
    await storeJSON(sessionShellKey(uid), { sessionId, quizTypeId, questionIds, questions, startedAt });
  }
  await storeJSON(sessionProgressKey(uid), { sessionId, ...progress });
};

export const getActiveSession = async (uid) => {
  const [shell, progress] = await Promise.all([
    getJSON(sessionShellKey(uid)),
    getJSON(sessionProgressKey(uid)),
  ]);
  if (!shell || !progress || shell.sessionId !== progress.sessionId) return null;
  return { ...shell, ...progress };
};

export const clearActiveSession = async (uid) => {
  await Promise.all([removeItem(sessionShellKey(uid)), removeItem(sessionProgressKey(uid))]);
};

// ─── Pending quiz submission (crash/offline durability) ────────────────────

export const savePendingSubmission = async (uid, payload) => {
  await storeJSON(pendingSubmissionKey(uid), { ...payload, savedAt: Date.now() });
};

export const getPendingSubmission = async (uid) => getJSON(pendingSubmissionKey(uid));

export const clearPendingSubmission = async (uid) => {
  await removeItem(pendingSubmissionKey(uid));
};
