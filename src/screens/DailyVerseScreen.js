// src/screens/DailyVerseScreen.js
// Premium swipeable daily verse cards — Firestore: dailyVerses

import React, { useCallback } from 'react';
import { subscribeToDailyVerses } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS, SWIPE_GRADIENTS } from '../constants/library';
import SwipeContentCarousel from '../components/library/SwipeContentCarousel';

export default function DailyVerseScreen() {
  const { items, loading, error, fromCache, retry } = useFirestoreSubscription(
    subscribeToDailyVerses,
    STORAGE_KEYS.LIBRARY_CACHE_VERSE
  );

  const shareMessage = useCallback(
    (item) => `"${item.verse}"\n— ${item.reference}\n\nShared via Faith Frames`,
    []
  );

  return (
    <SwipeContentCarousel
      items={items}
      loading={loading}
      error={error}
      fromCache={fromCache}
      accent={LIBRARY_ACCENTS.verse}
      gradients={SWIPE_GRADIENTS.verse}
      tagLabel="Daily Verse"
      tagIcon="book-outline"
      emptyIcon="book-open-outline"
      emptyTitle="No Verses Yet"
      emptyMessage="Daily verses will appear here once added by the admin."
      bookmarkStorageKey={STORAGE_KEYS.VERSE_BOOKMARKS}
      shareMessage={shareMessage}
      onRetry={retry}
    />
  );
}
