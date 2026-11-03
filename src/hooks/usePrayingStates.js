// src/hooks/usePrayingStates.js
// Per-user "I'm praying" state for a list of community prayer requests.
//
// Reuses the existing firebaseService transaction (togglePrayingForRequest),
// which writes the user's own prayingUsers/{uid} doc and nudges prayCount by
// exactly ±1 in the same transaction — so a user can never support the same
// request twice, and the count can't drift from the button state.
//
// Per-request state is read lazily, only for the ids currently on screen, and
// remembered for the session so re-opening the screen doesn't re-read it.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyPrayingState, togglePrayingForRequest } from '../services/firebaseService';

const sessionCache = new Map(); // `${uid}:${prayerId}` -> boolean
const DELTA_CLEAR_MS = 3000;

// Other screens (the prayer detail screen) can also toggle "praying". They call
// this so a list that is still mounted underneath shows the new state instead
// of the value it cached earlier in the session.
const changeListeners = new Set();
export function notifyPrayingChange(uid, prayerId, praying) {
  if (!uid || !prayerId) return;
  sessionCache.set(`${uid}:${prayerId}`, praying === true);
  changeListeners.forEach((listener) => listener(uid, prayerId, praying === true));
}

export default function usePrayingStates(uid, prayerIds) {
  const [states, setStates] = useState({}); // id -> boolean (absent = still loading)
  const [deltas, setDeltas] = useState({}); // id -> { base, delta } optimistic count adjustment
  const [busy, setBusy] = useState({});

  const statesRef = useRef(states);
  statesRef.current = states;
  const busyRef = useRef(new Set());
  const inflight = useRef(new Set());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A different account must never inherit the previous account's state.
  useEffect(() => {
    setStates({});
    setDeltas({});
    setBusy({});
    busyRef.current.clear();
  }, [uid]);

  // Pick up changes made on another screen (see notifyPrayingChange).
  useEffect(() => {
    const listener = (changedUid, prayerId, value) => {
      if (changedUid !== uid || !mounted.current) return;
      setStates((prev) => (prev[prayerId] === value ? prev : { ...prev, [prayerId]: value }));
    };
    changeListeners.add(listener);
    return () => {
      changeListeners.delete(listener);
    };
  }, [uid]);

  const idsKey = (prayerIds || []).join('|');

  useEffect(() => {
    if (!uid || !idsKey) return;
    const ids = idsKey.split('|');
    const cached = {};
    const toLoad = [];
    ids.forEach((id) => {
      const key = `${uid}:${id}`;
      if (sessionCache.has(key)) cached[id] = sessionCache.get(key);
      else if (!inflight.current.has(key)) toLoad.push(id);
    });
    if (Object.keys(cached).length) setStates((prev) => ({ ...prev, ...cached }));

    toLoad.forEach(async (id) => {
      const key = `${uid}:${id}`;
      inflight.current.add(key);
      try {
        const value = await getMyPrayingState(id, uid);
        sessionCache.set(key, value);
        if (mounted.current) setStates((prev) => ({ ...prev, [id]: value }));
      } catch {
        // Could not read it. Treat as "not praying" (not cached): the toggle
        // transaction re-reads the real state on the server and returns it.
        if (mounted.current) setStates((prev) => ({ ...prev, [id]: false }));
      } finally {
        inflight.current.delete(key);
      }
    });
  }, [uid, idsKey]);

  const toggle = useCallback(
    async (prayerId, liveCount) => {
      if (!uid) return { ok: false, reason: 'auth' };
      if (busyRef.current.has(prayerId)) return { ok: false, reason: 'busy' };
      const prev = statesRef.current[prayerId];
      if (prev === undefined) return { ok: false, reason: 'loading' };

      busyRef.current.add(prayerId);
      setBusy((b) => ({ ...b, [prayerId]: true }));

      const step = prev ? -1 : 1;
      const base = Number(liveCount || 0);
      setStates((s) => ({ ...s, [prayerId]: !prev }));
      setDeltas((d) => {
        const existing = d[prayerId];
        const keep = existing && existing.base === base;
        return { ...d, [prayerId]: { base, delta: (keep ? existing.delta : 0) + step } };
      });

      try {
        const next = await togglePrayingForRequest(prayerId, uid);
        sessionCache.set(`${uid}:${prayerId}`, next);
        if (mounted.current) {
          setStates((s) => ({ ...s, [prayerId]: next }));
          // Server disagreed with our optimistic guess (state changed elsewhere).
          if (next === prev) {
            setDeltas((d) => {
              const existing = d[prayerId];
              return existing ? { ...d, [prayerId]: { ...existing, delta: existing.delta - step } } : d;
            });
          }
          // Once the live snapshot catches up it carries the real count.
          setTimeout(() => {
            if (!mounted.current) return;
            setDeltas((d) => {
              if (!d[prayerId]) return d;
              const copy = { ...d };
              delete copy[prayerId];
              return copy;
            });
          }, DELTA_CLEAR_MS);
        }
        return { ok: true, next };
      } catch (err) {
        if (mounted.current) {
          setStates((s) => ({ ...s, [prayerId]: prev }));
          setDeltas((d) => {
            const existing = d[prayerId];
            return existing ? { ...d, [prayerId]: { ...existing, delta: existing.delta - step } } : d;
          });
        }
        return { ok: false, reason: 'error', message: err?.message };
      } finally {
        busyRef.current.delete(prayerId);
        if (mounted.current) setBusy((b) => ({ ...b, [prayerId]: false }));
      }
    },
    [uid]
  );

  const stateFor = useCallback(
    (prayerId) => ({
      ready: states[prayerId] !== undefined,
      praying: states[prayerId] === true,
      busy: busy[prayerId] === true,
    }),
    [states, busy]
  );

  const countFor = useCallback(
    (prayerId, liveCount) => {
      const base = Number(liveCount || 0);
      const d = deltas[prayerId];
      if (d && d.base === base) return Math.max(0, base + d.delta);
      return base;
    },
    [deltas]
  );

  return { stateFor, countFor, toggle };
}
