import { useCallback, useEffect, useState } from 'react';
import { getBookmarkIds, toggleBookmarkId, subscribeToStoredList } from '../storage';
import { STORAGE_KEYS } from '../constants';

export default function useStoryBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    let mounted = true;
    getBookmarkIds(STORAGE_KEYS.STORY_BOOKMARKS).then((ids) => {
      if (mounted) setBookmarks(ids || []);
    });
    // A bookmark toggled on the story detail screen republishes the new list
    // here, so already-mounted screens (the Settings stat cards, the favorites
    // list) reflect it immediately instead of only on their next mount.
    const unsubscribe = subscribeToStoredList(STORAGE_KEYS.STORY_BOOKMARKS, (ids) => {
      if (mounted) setBookmarks(ids || []);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    // toggleBookmarkId publishes the resulting list, which updates this hook
    // and every other consumer from a single source of truth.
    const next = await toggleBookmarkId(STORAGE_KEYS.STORY_BOOKMARKS, id);
    return next;
  }, []);

  const isBookmarked = useCallback(
    (id) => bookmarks.includes(id),
    [bookmarks]
  );

  return { bookmarks, isBookmarked, toggleBookmark };
}
