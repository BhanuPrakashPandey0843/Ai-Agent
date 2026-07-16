import { useCallback, useEffect, useState } from 'react';
import { getBookmarkIds, toggleBookmarkId } from '../storage';
import { STORAGE_KEYS } from '../constants';

export default function useStoryLikes() {
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    let mounted = true;
    getBookmarkIds(STORAGE_KEYS.STORY_LIKES).then((ids) => {
      if (mounted) setLikes(ids || []);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleLike = useCallback(async (id) => {
    const next = await toggleBookmarkId(STORAGE_KEYS.STORY_LIKES, id);
    setLikes(next || []);
    return next;
  }, []);

  const isLiked = useCallback(
    (id) => likes.includes(id),
    [likes]
  );

  return { likes, isLiked, toggleLike };
}
