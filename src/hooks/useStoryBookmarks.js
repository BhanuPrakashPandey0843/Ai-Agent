import { useCallback, useEffect, useState } from 'react';
import { getBookmarkIds, toggleBookmarkId } from '../storage';
import { STORAGE_KEYS } from '../constants';

export default function useStoryBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    let mounted = true;
    getBookmarkIds(STORAGE_KEYS.STORY_BOOKMARKS).then((ids) => {
      if (mounted) setBookmarks(ids || []);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    const next = await toggleBookmarkId(STORAGE_KEYS.STORY_BOOKMARKS, id);
    setBookmarks(next || []);
    return next;
  }, []);

  const isBookmarked = useCallback(
    (id) => bookmarks.includes(id),
    [bookmarks]
  );

  return { bookmarks, isBookmarked, toggleBookmark };
}
