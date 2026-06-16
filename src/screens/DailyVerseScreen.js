// src/screens/DailyVerseScreen.js
// Premium swipeable daily verse cards — Firestore: dailyVerses

import React, { useCallback } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { subscribeToDailyVerses } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { SWIPE_GRADIENTS } from '../constants/library';
import SwipeContentCarousel from '../components/library/SwipeContentCarousel';
import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';

export default function DailyVerseScreen() {
  const { items, loading, error, fromCache, refreshing, refresh, retry } = useFirestoreSubscription(
    subscribeToDailyVerses,
    STORAGE_KEYS.LIBRARY_CACHE_VERSE
  );
  const { isDark, colors } = useTheme();

  const shareMessage = useCallback(
    (item) => `"${item.verse}"\n— ${item.reference}\n\nShared via Faith Frames`,
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <BackHeader title="Daily Verse" />
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
          gradients={SWIPE_GRADIENTS.verse}
          tagLabel="Daily Verse"
          tagIcon="book-outline"
          emptyIcon="book-outline"
          emptyTitle="No Verses Yet"
          emptyMessage="Daily verses will appear here once added by the admin."
          bookmarkStorageKey={STORAGE_KEYS.VERSE_BOOKMARKS}
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
