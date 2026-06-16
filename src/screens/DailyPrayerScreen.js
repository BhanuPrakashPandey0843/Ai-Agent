// src/screens/DailyPrayerScreen.js
// Premium swipeable daily prayer cards — Firestore: dailyPrayers

import React, { useCallback } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { subscribeToDailyPrayers } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { SWIPE_GRADIENTS } from '../constants/library';
import SwipeContentCarousel from '../components/library/SwipeContentCarousel';
import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';

export default function DailyPrayerScreen() {
  const { items, loading, error, fromCache, refreshing, refresh, retry } = useFirestoreSubscription(
    subscribeToDailyPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_PRAYERS
  );
  const { isDark, colors } = useTheme();

  const shareMessage = useCallback(
    (item) => `${item.verse}\n— ${item.reference}\n\nShared via Faith Frames`,
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <BackHeader title="Daily Prayer" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <SwipeContentCarousel
          items={items}
          loading={loading}
          error={error}
          fromCache={fromCache}
          accent={colors.primary}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 28,
  },
});
