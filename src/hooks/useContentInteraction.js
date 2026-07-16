// src/hooks/useContentInteraction.js
// Shared like/dislike/save state + actions for a single Bible/Jesus/Prayers/
// Worship content item. Generic over `kind` so the four sections never
// duplicate this logic (and never accidentally write to the wrong Firestore
// collection, which is what happened when these screens borrowed the
// Witness-only useVideoInteraction hook).
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContentKindConfig } from '../constants/contentKinds';

export default function useContentInteraction(kind, item) {
  const config = getContentKindConfig(kind);
  const { user } = useAuth();
  const uid = user?.uid || null;
  const itemId = item?.id || null;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(item?.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(item?.dislikes || 0);
  const [busy, setBusy] = useState(false);

  // Keep local counts in sync if the underlying doc changes (realtime list update)
  useEffect(() => {
    setLikeCount(item?.likes || 0);
    setDislikeCount(item?.dislikes || 0);
  }, [item?.likes, item?.dislikes]);

  useEffect(() => {
    let cancelled = false;
    if (!uid || !itemId || !config) {
      setLiked(false);
      setDisliked(false);
      setSaved(false);
      return undefined;
    }
    (async () => {
      try {
        const [interaction, savedState] = await Promise.all([
          config.getUserInteraction(itemId, uid),
          config.isSaved(uid, itemId),
        ]);
        if (cancelled) return;
        setLiked(interaction?.liked === true);
        setDisliked(interaction?.disliked === true);
        setSaved(savedState === true);
      } catch {
        // silent — interaction state is a nice-to-have, not critical path
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, itemId, config]);

  const like = useCallback(async () => {
    if (!uid || !itemId || busy || !config) return;
    setBusy(true);
    const wasLiked = liked;
    const wasDisliked = disliked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    if (wasDisliked) {
      setDisliked(false);
      setDislikeCount((c) => Math.max(0, c - 1));
    }
    try {
      await config.toggleLike(itemId, uid);
    } catch {
      setLiked(wasLiked);
      setDisliked(wasDisliked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
      if (wasDisliked) setDislikeCount((c) => c + 1);
    } finally {
      setBusy(false);
    }
  }, [uid, itemId, liked, disliked, busy, config]);

  const dislike = useCallback(async () => {
    if (!uid || !itemId || busy || !config) return;
    setBusy(true);
    const wasLiked = liked;
    const wasDisliked = disliked;
    setDisliked(!wasDisliked);
    setDislikeCount((c) => Math.max(0, c + (wasDisliked ? -1 : 1)));
    if (wasLiked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    }
    try {
      await config.toggleDislike(itemId, uid);
    } catch {
      setLiked(wasLiked);
      setDisliked(wasDisliked);
      setDislikeCount((c) => Math.max(0, c + (wasDisliked ? 1 : -1)));
      if (wasLiked) setLikeCount((c) => c + 1);
    } finally {
      setBusy(false);
    }
  }, [uid, itemId, liked, disliked, busy, config]);

  const toggleSave = useCallback(async () => {
    if (!uid || !itemId || !config) return;
    const prev = saved;
    setSaved(!prev);
    try {
      await config.toggleSave(uid, item);
    } catch {
      setSaved(prev);
    }
  }, [uid, itemId, item, saved, config]);

  return {
    liked,
    disliked,
    saved,
    likeCount,
    dislikeCount,
    like,
    dislike,
    toggleSave,
    needsAuth: !uid,
  };
}
