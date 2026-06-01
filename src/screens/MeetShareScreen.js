// src/screens/MeetShareScreen.js
// Meet & Share sessions — Firestore: meetSessions

import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { subscribeToMeetSessions } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import MeetSessionCard from '../components/library/MeetSessionCard';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { Spacing } from '../theme/colors';

export default function MeetShareScreen() {
  const { showToast } = useToast();
  const { items, loading, error, refreshing, refresh, retry } =
    useFirestoreSubscription(subscribeToMeetSessions, STORAGE_KEYS.LIBRARY_CACHE_MEET);

  const handleJoinError = useCallback(
    (message) => showToast(message, 'error'),
    [showToast]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        {[0, 1].map((i) => (
          <SkeletonLoader
            key={i}
            height={220}
            borderRadius={24}
            style={{ marginBottom: Spacing.lg, marginHorizontal: Spacing.xl }}
          />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <LibraryErrorState message={error} onRetry={retry} accent={LIBRARY_ACCENTS.meet} />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <MeetSessionCard
          item={item}
          index={index}
          accent={LIBRARY_ACCENTS.meet}
          onJoinError={handleJoinError}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={LIBRARY_ACCENTS.meet}
        />
      }
      ListEmptyComponent={
        <LibraryEmptyState
          accent={LIBRARY_ACCENTS.meet}
          icon="videocam-outline"
          title="No Sessions Yet"
          message="Live meet & share sessions will appear here once scheduled by the admin."
        />
      }
      initialNumToRender={5}
      maxToRenderPerBatch={6}
      windowSize={5}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, paddingTop: Spacing.md },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
});
