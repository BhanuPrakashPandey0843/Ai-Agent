// src/screens/AllFaithStoriesScreen.js
// Full list of Faith Stories — Firestore: "stories" (same source as admin
// /admin/uploads/upload-stories and the Home screen's Faith Stories section).
// Reuses the existing data layer (subscribeToStories, useFirestoreSubscription,
// storyTimestamp) and the shared ProphetStoryCard component. No new fetching
// logic, no mock data.

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../context/ThemeContext';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { subscribeToStories, storyTimestamp } from '../services/firebaseService';
import { STORAGE_KEYS } from '../constants';
import { LIBRARY_ACCENTS } from '../constants/library';
import BackHeader from '../components/common/BackHeader';
import LibraryErrorState from '../components/library/LibraryErrorState';
import ProphetStoryCard, { SkeletonProphetStoryCard } from '../components/home/ProphetStoryCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Typography, Spacing, BorderRadius } from '../theme/colors';

const SIDE_INSET = 20;
const ACCENT = LIBRARY_ACCENTS.faithStories;

function StoriesHero({ count, colors }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(14)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
          <Ionicons name="book" size={22} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Faith Stories</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            {count > 0
              ? `${count} timeless ${count === 1 ? 'story' : 'stories'} from God's messengers`
              : "Timeless lessons from God's messengers"}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function SearchBar({ value, onChangeText, colors, isDark }) {
  return (
    <View
      style={[
        styles.searchBar,
        {
          backgroundColor: colors.bgCard,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={[styles.searchInput, { color: colors.textPrimary }]}
        placeholder="Search stories or prophets"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StoriesEmptyState({ colors, hasQuery, onClearQuery, onRefresh }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: ACCENT + '15' }]}>
        <Ionicons name={hasQuery ? 'search-outline' : 'book-outline'} size={32} color={ACCENT} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {hasQuery ? 'No matching stories' : 'No Faith Stories Yet'}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {hasQuery
          ? 'Try a different title or prophet name.'
          : 'New stories uploaded from the admin panel will appear here automatically.'}
      </Text>
      <TouchableOpacity
        onPress={hasQuery ? onClearQuery : onRefresh}
        activeOpacity={0.85}
        style={[styles.emptyBtn, { backgroundColor: ACCENT }]}
      >
        <Text style={styles.emptyBtnText}>{hasQuery ? 'Clear Search' : 'Refresh'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AllFaithStoriesScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - SIDE_INSET * 2;

  const { items, loading, error, refreshing, fromCache, refresh, retry } = useFirestoreSubscription(
    subscribeToStories,
    STORAGE_KEYS.LIBRARY_CACHE_STORIES
  );

  const sortedStories = useMemo(() => {
    if (!items?.length) return [];
    return [...items].sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return storyTimestamp(b) - storyTimestamp(a);
    });
  }, [items]);

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedStories;
    return sortedStories.filter((s) => {
      const haystack = [s.title, s.prophetName, s.description].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [sortedStories, searchQuery]);

  const handleOpenStory = useCallback(
    (story) => {
      navigation.navigate('ProphetStoryDetails', { storyId: story.id });
    },
    [navigation]
  );

  const handleClearQuery = useCallback(async () => {
    await Haptics.selectionAsync();
    setSearchQuery('');
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <ProphetStoryCard
        story={item}
        index={index}
        onPress={handleOpenStory}
        colors={colors}
        isDark={isDark}
        cardWidth={cardWidth}
      />
    ),
    [handleOpenStory, colors, isDark, cardWidth]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Faith Stories" />
        <View style={styles.loading}>
          {[0, 1, 2].map((i) => (
            <SkeletonLoader
              key={i}
              height={190}
              borderRadius={20}
              style={{ marginBottom: Spacing.lg, marginHorizontal: Spacing.xl }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (error && !sortedStories.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <BackHeader title="Faith Stories" />
        <LibraryErrorState
          message={fromCache ? 'Cached stories are unavailable. Check your connection and try again.' : error}
          onRetry={retry}
          accent={ACCENT}
        />
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
      <BackHeader title="Faith Stories" />
      <FlatList
        data={filteredStories}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <StoriesHero count={sortedStories.length} colors={colors} />
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              colors={colors}
              isDark={isDark}
            />
          </>
        }
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
          <StoriesEmptyState
            colors={colors}
            hasQuery={searchQuery.trim().length > 0}
            onClearQuery={handleClearQuery}
            onRefresh={refresh}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    paddingVertical: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.huge,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.fontSizeMD,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.xxl,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
  },
});
