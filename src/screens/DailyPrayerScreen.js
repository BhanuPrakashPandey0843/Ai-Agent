// src/screens/DailyPrayerScreen.js
// Premium swipeable daily prayer cards — Firestore: dailyprayers

import React, { useCallback } from 'react';
import { subscribeToDailyPrayers } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS, SWIPE_GRADIENTS } from '../constants/library';
import SwipeContentCarousel from '../components/library/SwipeContentCarousel';

export default function DailyPrayerScreen() {
  const { items, loading, error, fromCache, retry } = useFirestoreSubscription(
    subscribeToDailyPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_PRAYERS
  );

  const shareMessage = useCallback(
    (item) => `${item.verse}\n— ${item.reference}\n\nShared via Faith Frames`,
    []
  );

  return (
    <SwipeContentCarousel
      items={items}
      loading={loading}
      error={error}
      fromCache={fromCache}
      accent={LIBRARY_ACCENTS.prayer}
      gradients={SWIPE_GRADIENTS.prayer}
      tagLabel="Daily Prayer"
      tagIcon="hand-left-outline"
      emptyIcon="hand-left-outline"
      emptyTitle="No Prayers Yet"
      emptyMessage="Daily prayers will appear here once added by the admin."
      bookmarkStorageKey={STORAGE_KEYS.PRAYER_BOOKMARKS}
      shareMessage={shareMessage}
      onRetry={retry}
    />
  );
}
