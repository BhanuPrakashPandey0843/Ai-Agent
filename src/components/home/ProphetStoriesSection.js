import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import useFirestoreSubscription from '../../hooks/useFirestoreSubscription';
import { subscribeToStories, storyTimestamp } from '../../services/firebaseService';
import { STORAGE_KEYS } from '../../constants';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';

const SIDE_INSET = 20;
const VERTICAL_GAP = 20;
const NUM_COLUMNS = 1;

const ProphetStoryCard = React.memo(function ProphetStoryCard({
  story,
  onPress,
  colors,
  isDark,
  cardWidth,
  index,
}) {
  const [imageError, setImageError] = React.useState(false);
  const pressScale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const delay = Math.min(index, 9) * 45;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 15,
        tension: 110,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index]);

  const handlePressIn = React.useCallback(() => {
    Animated.spring(pressScale, { toValue: 0.97, friction: 14, useNativeDriver: true }).start();
  }, [pressScale]);

  const handlePressOut = React.useCallback(() => {
    Animated.spring(pressScale, { toValue: 1, friction: 14, useNativeDriver: true }).start();
  }, [pressScale]);

  const handlePress = React.useCallback(async () => {
    await Haptics.selectionAsync();
    onPress(story);
  }, [onPress, story]);

  const imageHeight = cardWidth * 0.56;
  const titleFontSize = cardWidth * 0.045;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width: cardWidth,
          opacity,
          transform: [{ translateY }, { scale: pressScale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Open story ${story.title || 'prophet story'}`}
        accessibilityHint={`Read the story of ${story.prophetName || story.category || 'a prophet'}`}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: isDark ? 'rgba(168, 159, 255, 0.18)' : 'rgba(146, 138, 253, 0.18)',
              shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)',
            },
          ]}
        >
          <View style={[styles.imageContainer, { height: imageHeight }]}>
            {!story.image || imageError ? (
              <View
                style={[
                  styles.fallbackImage,
                  {
                    backgroundColor: colors.bgCardSoft,
                  },
                ]}
              >
                <Ionicons name="book" size={cardWidth * 0.12} color={colors.primary} />
              </View>
            ) : (
              <Image
                source={{ uri: story.image }}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
                style={styles.image}
                onError={() => setImageError(true)}
              />
            )}
          </View>

          <View style={styles.titleArea}>
            <Text
              style={[
                styles.storyTitle,
                {
                  color: colors.textPrimary,
                  fontSize: titleFontSize,
                  lineHeight: titleFontSize * 1.35,
                },
              ]}
              numberOfLines={2}
            >
              {story.title || 'Story'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

function SectionHeader({ colors, isDark, onViewAll }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerTextGroup}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Prophet Stories</Text>
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
          accessibilityLabel="View all prophet stories"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const SkeletonCard = React.memo(function SkeletonCard({ cardWidth, colors, isDark }) {
  const imageHeight = cardWidth * 0.56;

  return (
    <View style={[styles.cardWrapper, { width: cardWidth }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)',
          },
        ]}
      >
        <View
          style={[
            styles.imageContainer,
            {
              height: imageHeight,
              backgroundColor: colors.bgCardSoft,
            },
          ]}
        >
          <SkeletonLoader width="100%" height="100%" borderRadius={18} />
        </View>

        <View style={styles.titleArea}>
          <SkeletonLoader width="80%" height={18} borderRadius={9} />
        </View>
      </View>
    </View>
  );
});

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
    navigation.navigate('Library');
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
              <SkeletonCard cardWidth={cardWidth} colors={colors} isDark={isDark} />
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
  cardWrapper: {
    marginBottom: VERTICAL_GAP,
  },
  card: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  storyTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'left',
  },
});
