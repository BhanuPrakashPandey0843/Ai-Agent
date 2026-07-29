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
