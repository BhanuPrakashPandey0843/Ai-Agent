import { STORAGE_KEYS } from '../constants';
import { storeJSON, getJSON, removeItem } from './index';

const cacheKey = (uid) => `${STORAGE_KEYS.QUIZ_QUESTION_CACHE}_${uid || 'guest'}`;
const attemptedKey = (uid) => `${STORAGE_KEYS.QUIZ_ATTEMPTED_CACHE}_${uid || 'guest'}`;
const sessionKey = (uid) => `${STORAGE_KEYS.QUIZ_ACTIVE_SESSION}_${uid || 'guest'}`;

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

export const saveActiveSession = async (uid, session) => {
  await storeJSON(sessionKey(uid), session);
};

export const getActiveSession = async (uid) => getJSON(sessionKey(uid));

export const clearActiveSession = async (uid) => {
  await removeItem(sessionKey(uid));
};
