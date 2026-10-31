// src/hooks/useVideoInteraction.js
// Shared like/dislike/save state + actions for a single witness video.
// Used by both WitnessVideoCard (list) and VideoPlayerScreen so the two
// surfaces never drift out of sync in behavior.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getUserVideoInteraction,
  toggleVideoLike,
  toggleVideoDislike,
  isVideoSaved,
  toggleSaveVideo,
  subscribeToWitnessVideoStats,
} from '../services/firebaseService';

export default function useVideoInteraction(video) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const uid = user?.uid || null;
  const videoId = video?.id || null;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(video?.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(video?.dislikes || 0);
  const [viewCount, setViewCount] = useState(video?.views || 0);
  const [commentCount, setCommentCount] = useState(video?.commentCount || 0);
  const [busy, setBusy] = useState(false);
  const [stateLoading, setStateLoading] = useState(!!(uid && videoId));

  // Keep local counts in sync if the underlying doc changes (realtime list update)
  useEffect(() => {
    setLikeCount(Number(video?.likes || 0));
    setDislikeCount(Number(video?.dislikes || 0));
    setViewCount(Number(video?.views || 0));
    setCommentCount(Number(video?.commentCount || 0));
  }, [video?.likes, video?.dislikes, video?.views, video?.commentCount]);

  useEffect(() => {
    if (!videoId) return undefined;
    return subscribeToWitnessVideoStats(
      videoId,
      (stats) => {
        if (!stats) return;
        setLikeCount(stats.likes);
        setDislikeCount(stats.dislikes);
        setViewCount(stats.views);
        setCommentCount(stats.commentCount);
      },
      (err) => showToast(
        err?.code === 'permission-denied'
          ? 'Video reactions are unavailable until the latest Firestore rules are deployed.'
          : 'Could not refresh video reactions.',
        'error'
      )
    );
  }, [showToast, videoId]);

  useEffect(() => {
    let cancelled = false;
    if (!uid || !videoId) {
      setLiked(false);
      setDisliked(false);
      setSaved(false);
      setStateLoading(false);
      return;
    }
    setStateLoading(true);
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
      } catch (err) {
        console.warn('[useVideoInteraction] Could not load reaction state:', err?.code, err?.message);
        showToast('Could not load your video reactions.', 'error');
      } finally {
        if (!cancelled) setStateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast, uid, videoId]);

  const like = useCallback(async () => {
    if (!uid || !videoId || busy) return;
    setBusy(true);
    const wasLiked = liked;
    const wasDisliked = disliked;
    setLiked(!wasLiked);
    if (wasDisliked) {
      setDisliked(false);
    }
    try {
      await toggleVideoLike(videoId, uid);
    } catch (err) {
      setLiked(wasLiked);
      setDisliked(wasDisliked);
      showToast(err?.message || 'Could not update your reaction.', 'error');
    } finally {
      setBusy(false);
    }
  }, [uid, videoId, liked, disliked, busy, showToast]);

  const dislike = useCallback(async () => {
    if (!uid || !videoId || busy) return;
    setBusy(true);
    const wasLiked = liked;
    const wasDisliked = disliked;
    setDisliked(!wasDisliked);
    if (wasLiked) {
      setLiked(false);
    }
    try {
      await toggleVideoDislike(videoId, uid);
    } catch (err) {
      setLiked(wasLiked);
      setDisliked(wasDisliked);
      showToast(err?.message || 'Could not update your reaction.', 'error');
    } finally {
      setBusy(false);
    }
  }, [uid, videoId, liked, disliked, busy, showToast]);

  const toggleSave = useCallback(async () => {
    if (!uid || !videoId) return;
    const prev = saved;
    setSaved(!prev);
    try {
      await toggleSaveVideo(uid, video);
    } catch (err) {
      setSaved(prev);
      showToast(err?.message || 'Could not save this video.', 'error');
    }
  }, [uid, videoId, video, saved, showToast]);

  return {
    liked,
    disliked,
    saved,
    likeCount,
    dislikeCount,
    viewCount,
    commentCount,
    like,
    dislike,
    toggleSave,
    busy: busy || stateLoading,
    needsAuth: !uid,
  };
}
