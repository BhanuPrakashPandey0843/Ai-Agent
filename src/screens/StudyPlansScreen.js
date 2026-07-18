// src/screens/StudyPlansScreen.js
// God's Words study plans — Firestore: studyPlans

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToGodsWords } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import StudyPlanCard from '../components/library/StudyPlanCard';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Typography, Spacing, BorderRadius } from '../theme/colors';
import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';

const ACCENT = LIBRARY_ACCENTS.study;

function StudyHero({ count }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
          <Ionicons name="library" size={22} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Grow in the Word</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            {count > 0 ? `${count} guided ${count === 1 ? 'plan' : 'plans'} to walk through` : 'Structured plans to deepen your study'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

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
        ListHeaderComponent={items.length > 0 ? <StudyHero count={items.length} /> : null}
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    letterSpacing: 0.1,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizeSM,
    marginTop: 2,
  },
});
