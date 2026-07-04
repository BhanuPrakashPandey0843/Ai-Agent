// src/screens/StudyPlansScreen.js
// God's Words study plans — Firestore: studyPlans

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { subscribeToGodsWords } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import StudyPlanCard from '../components/library/StudyPlanCard';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Spacing } from '../theme/colors';
import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';

export default function StudyPlansScreen() {
  const [expandedId, setExpandedId] = useState(null);
  const { items, loading, error, refreshing, refresh, retry } = useFirestoreSubscription(
    subscribeToGodsWords,
    STORAGE_KEYS.LIBRARY_CACHE_STUDY
  );
  const { isDark, colors } = useTheme();

  const toggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Study Plans" />
        <View style={styles.loading}>
          {[0, 1, 2].map((i) => (
            <SkeletonLoader
              key={i}
              height={120}
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
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Study Plans" />
        <LibraryErrorState message={error} onRetry={retry} accent={LIBRARY_ACCENTS.study} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <BackHeader title="Study Plans" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <StudyPlanCard
            item={item}
            index={index}
            accent={LIBRARY_ACCENTS.study}
            expanded={expandedId === item.id}
            onPress={() => toggleExpand(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <LibraryEmptyState
            accent={LIBRARY_ACCENTS.study}
            icon="library-outline"
            title="No Study Plans Yet"
            message="Bible study plans will appear here once added by the admin."
          />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: { flex: 1, paddingTop: Spacing.md },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
});
