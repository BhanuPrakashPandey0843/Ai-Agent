// src/utils/prayerRoom.js
// Shared helpers for the Prayer Room.
//
// Date keys ("YYYY-MM-DD") are always built and parsed in LOCAL time. Never use
// `new Date('YYYY-MM-DD')` for them: that string form is parsed as UTC, which
// shows the previous/next calendar day depending on the user's timezone.
import { mapUserPrayerToFeedItem } from '../services/firebaseService';
import { dateKey } from '../components/prayer/PrayerDateTimeline';

export const MAX_PRAYER_WORDS = 500;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const countWords = (text) => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};

/** Firestore Timestamp | {seconds} | Date | number -> epoch ms (null if unknown / still pending). */
export const tsMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return null;
};

/** "2026-11-04" -> local Date (noon, so DST shifts can never change the day). */
export const parseDateKey = (key) => {
  const m = DATE_KEY_RE.exec(String(key || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  // Reject overflow such as 2026-02-31 (would silently roll into March).
  return dateKey(d) === key ? d : null;
};

export const getTodayKey = () => dateKey(new Date());

/** Move a date key by whole days; month and year boundaries are handled by Date. */
export const shiftDateKey = (key, days) => {
  const d = parseDateKey(key);
  if (!d) return key;
  d.setDate(d.getDate() + days);
  return dateKey(d);
};

export const formatDateKey = (key, withYear = false) => {
  const d = parseDateKey(key);
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: withYear ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  });
};

/**
 * Shape a raw `userPrayers` document for the Prayer Room list.
 * Reuses the existing feed mapper so ids ("user-<docId>") stay identical to the
 * ones already stored in the user's bookmarks.
 */
export function toRoomItem(raw, uid) {
  const base = mapUserPrayerToFeedItem(raw);
  return {
    ...base,
    kind: raw?.category === 'personal' ? 'personal' : 'community',
    isMine: !!uid && raw?.userId === uid,
    sortMs: tsMillis(raw?.createdAt),
  };
}

/** Admin-uploaded prayer (dailyPrayers collection). */
export function toAdminItem(item) {
  return {
    ...item,
    kind: 'admin',
    isMine: false,
    sortMs: tsMillis(item?.createdAt),
  };
}

/** Newest first; documents whose server timestamp is still pending sort to the top. */
export const sortNewest = (a, b) =>
  (b.sortMs ?? Number.MAX_SAFE_INTEGER) - (a.sortMs ?? Number.MAX_SAFE_INTEGER);

/** Search across title, content and description (already lower-cased query). */
export function matchesQuery(item, lowerQuery) {
  if (!lowerQuery) return true;
  return (
    String(item.title || '').toLowerCase().includes(lowerQuery) ||
    String(item.verse || '').toLowerCase().includes(lowerQuery) ||
    String(item.description || '').toLowerCase().includes(lowerQuery) ||
    String(item.reference || '').toLowerCase().includes(lowerQuery)
  );
}

/** Rejects with a coded error if `promise` doesn't settle in time (e.g. offline). */
export const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error('Request timed out');
      err.code = 'app/timeout';
      reject(err);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

/** Turn a Firebase/app error into a message that says what actually went wrong. */
export const describePrayerError = (err, editing = false) => {
  const code = err?.code || '';
  switch (code) {
    case 'app/validation':
      return err.message;
    case 'app/no-session':
    case 'unauthenticated':
    case 'auth/user-token-expired':
    case 'auth/id-token-expired':
    case 'auth/user-not-found':
    case 'auth/user-disabled':
    case 'auth/requires-recent-login':
      return 'Your session has expired. Please sign out and sign in again, then try again.';
    case 'app/timeout':
    case 'unavailable':
    case 'deadline-exceeded':
    case 'auth/network-request-failed':
      return 'Could not reach the server. Check your internet connection and try again.';
    case 'resource-exhausted':
      return 'Too many requests right now. Please wait a moment and try again.';
    case 'permission-denied':
      return editing
        ? 'The server did not allow this change. Please try again later.'
        : 'The server rejected this prayer. Please try again later; if it keeps happening, contact support.';
    default:
      return editing ? 'Could not save your changes. Please try again.' : 'Could not send your prayer. Please try again.';
  }
};
