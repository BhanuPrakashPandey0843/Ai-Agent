// src/screens/WitnessScreen.js
// Testimony feed — Firestore: witnessPosts

import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, StatusBar } from 'react-native';
import { subscribeToWitness } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import WitnessCard from '../components/library/WitnessCard';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Spacing } from '../theme/colors';
import BackHeader from '../components/common/BackHeader';

export default function WitnessScreen() {
  const { items, loading, error, refreshing, refresh, retry } = useFirestoreSubscription(
    subscribeToWitness,
    STORAGE_KEYS.LIBRARY_CACHE_WITNESS
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Witness" />
        <View style={styles.loading}>
          {[0, 1].map((i) => (
            <SkeletonLoader
              key={i}
              height={280}
              borderRadius={24}
              style={{ marginBottom: Spacing.lg, marginHorizontal: Spacing.xl }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Witness" />
        <LibraryErrorState message={error} onRetry={retry} accent={LIBRARY_ACCENTS.witness} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <BackHeader title="Witness" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <WitnessCard item={item} index={index} accent={LIBRARY_ACCENTS.witness} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={LIBRARY_ACCENTS.witness}
            backgroundColor="#000000"
          />
        }
        ListEmptyComponent={
          <LibraryEmptyState
            accent={LIBRARY_ACCENTS.witness}
            icon="people-outline"
            title="No Testimonies Yet"
            message="Witness stories will appear here once shared by the admin."
          />
        }
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loading: { flex: 1, paddingTop: Spacing.md },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
});
