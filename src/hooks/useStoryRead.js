import { useCallback, useEffect, useState } from 'react';
import { getBookmarkIds, toggleBookmarkId } from '../storage';
import { STORAGE_KEYS } from '../constants';

export default function useStoryRead() {
  const [read, setRead] = useState([]);

  useEffect(() => {
    let mounted = true;
    getBookmarkIds(STORAGE_KEYS.STORY_READ).then((ids) => {
      if (mounted) setRead(ids || []);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const markRead = useCallback(async (id) => {
    const ids = await getBookmarkIds(STORAGE_KEYS.STORY_READ);
    if (!ids.includes(id)) {
      const next = [...ids, id];
      await toggleBookmarkId(STORAGE_KEYS.STORY_READ, id);
      setRead(next);
    }
    return read;
  }, [read]);

  const isRead = useCallback(
    (id) => read.includes(id),
    [read]
  );

  return { read, isRead, markRead };
}
