import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import useFirestoreSubscription from '../../hooks/useFirestoreSubscription';
import { subscribeToStories, storyTimestamp } from '../../services/firebaseService';
import { STORAGE_KEYS } from '../../constants';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import ProphetStoryCard, { SkeletonProphetStoryCard } from './ProphetStoryCard';

const SIDE_INSET = 20;
const VERTICAL_GAP = 20;
const NUM_COLUMNS = 1;

function SectionHeader({ colors, isDark, onViewAll }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerTextGroup}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Faith Stories</Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]} numberOfLines={1}>
          Timeless lessons from God's messengers
        </Text>
      </View>
      {onViewAll ? (
        <TouchableOpacity
          onPress={onViewAll}
          activeOpacity={0.7}
          style={[styles.viewAllButton, { backgroundColor: colors.accentSoft }]}
          accessibilityRole="button"
          accessibilityLabel="View all faith stories"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View More</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function ProphetStoriesSection() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();

  const { items, loading, error, fromCache, refresh, retry } = useFirestoreSubscription(
    subscribeToStories,
    STORAGE_KEYS.LIBRARY_CACHE_STORIES
  );

  const stories = useMemo(() => {
    if (!items?.length) return [];
    return [...items].sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return storyTimestamp(b) - storyTimestamp(a);
    });
  }, [items]);

  const handleOpenStory = useCallback(
    (story) => {
      navigation.navigate('ProphetStoryDetails', { storyId: story.id });
    },
    [navigation]
  );

  const handleViewAll = useCallback(async () => {
    await Haptics.selectionAsync();
    navigation.navigate('AllFaithStories');
  }, [navigation]);

  const cardWidth = screenWidth - SIDE_INSET * 2;

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
      <View style={[styles.section, { backgroundColor: colors.bg }]}>
        <SectionHeader colors={colors} isDark={isDark} />
        <View style={styles.loadingContainer}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={{ marginBottom: VERTICAL_GAP }}>
              <SkeletonProphetStoryCard
                cardWidth={cardWidth}
                colors={colors}
                isDark={isDark}
                SkeletonLoader={SkeletonLoader}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error && !stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: colors.bg }]}>
        <SectionHeader colors={colors} isDark={isDark} />
        <EmptyState
          icon="cloud-offline-outline"
          title="Unable to load stories"
          message={fromCache ? 'Cached stories are unavailable. Check your connection and try again.' : error}
          actionLabel="Retry"
          onAction={retry}
        />
      </View>
    );
  }

  if (!loading && !stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: colors.bg }]}>
        <SectionHeader colors={colors} isDark={isDark} />
        <EmptyState
          icon="book-outline"
          title="No stories available yet"
          message="New Prophet stories will appear here as soon as they are published."
          actionLabel="Refresh"
          onAction={refresh}
        />
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: colors.bg }]}>
      <SectionHeader colors={colors} isDark={isDark} onViewAll={handleViewAll} />
      <FlatList
        key={`prophet-stories-${NUM_COLUMNS}`}
        data={stories}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.flatListContent}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 26,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_INSET,
    marginBottom: 22,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingHorizontal: SIDE_INSET,
  },
  flatListContent: {
    paddingHorizontal: SIDE_INSET,
  },
});
