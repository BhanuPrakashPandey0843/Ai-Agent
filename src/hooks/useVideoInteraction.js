// src/hooks/useVideoInteraction.js
// Shared like/dislike/save state + actions for a single witness video.
// Used by both WitnessVideoCard (list) and VideoPlayerScreen so the two
// surfaces never drift out of sync in behavior.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserVideoInteraction,
  toggleVideoLike,
  toggleVideoDislike,
  isVideoSaved,
  toggleSaveVideo,
} from '../services/firebaseService';

export default function useVideoInteraction(video) {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const videoId = video?.id || null;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(video?.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(video?.dislikes || 0);
  const [busy, setBusy] = useState(false);

  // Keep local counts in sync if the underlying doc changes (realtime list update)
  useEffect(() => {
    setLikeCount(video?.likes || 0);
    setDislikeCount(video?.dislikes || 0);
  }, [video?.likes, video?.dislikes]);

  useEffect(() => {
    let cancelled = false;
    if (!uid || !videoId) {
      setLiked(false);
      setDisliked(false);
      setSaved(false);
      return;
    }
    (async () => {
      try {
        const [interaction, savedState] = await Promise.all([
          getUserVideoInteraction(videoId, uid),
          isVideoSaved(uid, videoId),
        ]);
        if (cancelled) return;
        setLiked(interaction.liked === true);
        setDisliked(interaction.disliked === true);
        setSaved(savedState === true);
      } catch {
        // silent — interaction state is a nice-to-have, not critical path
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, videoId]);

  const like = useCallback(async () => {
    if (!uid || !videoId || busy) return;
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
      await toggleVideoLike(videoId, uid);
    } catch {
      setLiked(wasLiked);
      setDisliked(wasDisliked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
      if (wasDisliked) setDislikeCount((c) => c + 1);
    } finally {
      setBusy(false);
    }
  }, [uid, videoId, liked, disliked, busy]);

  const dislike = useCallback(async () => {
    if (!uid || !videoId || busy) return;
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
      await toggleVideoDislike(videoId, uid);
    } catch {
      setLiked(wasLiked);
      setDisliked(wasDisliked);
      setDislikeCount((c) => Math.max(0, c + (wasDisliked ? 1 : -1)));
      if (wasLiked) setLikeCount((c) => c + 1);
    } finally {
      setBusy(false);
    }
  }, [uid, videoId, liked, disliked, busy]);

  const toggleSave = useCallback(async () => {
    if (!uid || !videoId) return;
    const prev = saved;
    setSaved(!prev);
    try {
      await toggleSaveVideo(uid, video);
    } catch {
      setSaved(prev);
    }
  }, [uid, videoId, video, saved]);

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
