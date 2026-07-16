import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../context/ThemeContext';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { subscribeToStories, subscribeToFeaturedStories } from '../services/firebaseService';
import { STORAGE_KEYS } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/common/BackHeader';
import useStoryBookmarks from '../hooks/useStoryBookmarks';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';

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
        accessibilityLabel={`Open story ${story.title || 'story'}`}
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

export default function FavoriteStoriesScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { bookmarks } = useStoryBookmarks();

  const { items: regularStories, loading: loadingRegular, error: errorRegular, refresh, retry } = useFirestoreSubscription(
    subscribeToStories,
    STORAGE_KEYS.LIBRARY_CACHE_STORIES
  );

  const { items: featuredStories, loading: loadingFeatured, error: errorFeatured } = useFirestoreSubscription(
    subscribeToFeaturedStories,
    STORAGE_KEYS.LIBRARY_CACHE_FEATURED_STORIES
  );

  const allStories = useMemo(() => {
    return [...(regularStories || []), ...(featuredStories || [])];
  }, [regularStories, featuredStories]);

  const favoriteStories = useMemo(() => {
    if (!allStories?.length || !bookmarks?.length) return [];
    return allStories.filter(story => bookmarks.includes(story.id));
  }, [allStories, bookmarks]);

  const handleOpenStory = useCallback(
    (story) => {
      navigation.navigate('ProphetStoryDetails', { storyId: story.id });
    },
    [navigation]
  );

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

  const loading = loadingRegular || loadingFeatured;
  const error = errorRegular || errorFeatured;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <BackHeader title="Favorite Stories" />

      {error && !loading && !favoriteStories.length ? (
        <View style={styles.infoBox}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Unable to load stories"
            message={error}
            actionLabel="Retry"
            onAction={retry}
          />
        </View>
      ) : null}

      <FlatList
        data={favoriteStories}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.flatListContent,
          { paddingBottom: insets.bottom + 24 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              {[0, 1, 2].map((key) => (
                <View key={key} style={{ marginBottom: VERTICAL_GAP }}>
                  <SkeletonCard cardWidth={cardWidth} colors={colors} isDark={isDark} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <EmptyState
                icon="bookmark-outline"
                title="No favorite stories yet"
                message="Tap the bookmark button on any story to add it here."
              />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatListContent: {
    paddingHorizontal: SIDE_INSET,
    paddingTop: 12,
  },
  loadingContainer: {
    paddingHorizontal: SIDE_INSET,
    paddingTop: 12,
  },
  infoBox: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  emptyState: {
    marginTop: 60,
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
