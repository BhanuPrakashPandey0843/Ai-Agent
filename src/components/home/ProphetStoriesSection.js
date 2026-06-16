import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import useFirestoreSubscription from '../../hooks/useFirestoreSubscription';
import { subscribeToStories, storyTimestamp } from '../../services/firebaseService';
import { STORAGE_KEYS } from '../../constants';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';

const AnimatedFlatList = Animated.FlatList;
const CARD_WIDTH_RATIO = 0.85;
const CARD_HEIGHT = 248;
const CARD_SPACING = 18;
const IMAGE_HEIGHT = 158;

const ProphetStoryCard = React.memo(function ProphetStoryCard({ story, index, cardWidth, scrollX, onPress, isFeatured, colors, isDark }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 10,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const imageTranslate = scrollX.interpolate({
    inputRange: [
      (index - 1) * (cardWidth + CARD_SPACING),
      index * (cardWidth + CARD_SPACING),
      (index + 1) * (cardWidth + CARD_SPACING),
    ],
    outputRange: [-14, 0, 14],
    extrapolate: 'clamp',
  });

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress(story);
  };

  const renderImage = () => {
    if (!story.image || imageError) {
      return (
        <View style={[styles.fallbackImage, { backgroundColor: isDark ? '#1F1F1F' : '#F7F3EC' }]}> 
          <Ionicons name="book-outline" size={44} color={isDark ? '#FFF' : '#555'} />
        </View>
      );
    }

    return (
      <Image
        source={{ uri: story.image }}
        contentFit="cover"
        transition={320}
        cachePolicy="memory-disk"
        style={styles.image}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
      />
    );
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width: cardWidth,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Open story ${story.title}`}
        accessibilityHint={`Read the story of ${story.prophetName || story.category || 'a prophet'}`}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#141414' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#ECECEC',
              shadowColor: isDark ? '#000' : '#000',
            },
          ]}
        >
          <View style={styles.imageFrame}>
            <Animated.View
              style={[
                styles.imageTranslate,
                { transform: [{ translateX: imageTranslate }] },
              ]}
            >
              {renderImage()}
            </Animated.View>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.48)', 'rgba(0,0,0,0.75)']}
              style={styles.imageOverlay}
            />
            {isFeatured ? (
              <View style={styles.featuredTag}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
                <Text style={[styles.featuredTagText, { color: colors.primary }]}>Featured Story</Text>
              </View>
            ) : null}
            {!imageLoaded && !imageError ? (
              <View style={styles.imageSkeleton}>
                <SkeletonLoader width="100%" height="100%" borderRadius={28} />
              </View>
            ) : null}
          </View>

          <View style={styles.contentArea}>
            <Text style={[styles.storyTitle, { color: colors.text }]} numberOfLines={2}>
              {story.title || `Prophet ${story.prophetName || 'Story'}`}
            </Text>
            <Text style={[styles.storyTeaser, { color: colors.textSecondary }]} numberOfLines={2}>
              {story.description || `Discover how faith and courage shaped this journey.`}
            </Text>
            <View style={styles.bottomRow}>
              <View style={[styles.storyBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(34,34,34,0.06)' }]}> 
                <Text style={[styles.badgeLabel, { color: colors.textSecondary }]}> {story.prophetName || story.category || 'Prophet Story'} </Text>
              </View>
              <LinearGradient
                colors={[colors.primary, colors.accent || colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.readButton}
              >
                <Text style={styles.readText}>Read Story →</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ProphetStoriesSection() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * CARD_WIDTH_RATIO);
  const scrollX = useRef(new Animated.Value(0)).current;

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

  const handleOpenStory = (story) => {
    navigation.navigate('ProphetStoryDetails', { storyId: story.id });
  };

  const renderSkeletonCard = (key) => (
    <View key={key} style={[styles.cardWrapper, { width: cardWidth }]}> 
      <View style={[styles.card, { backgroundColor: isDark ? '#141414' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#ECECEC' }]}>
        <View style={[styles.imageFrame, { backgroundColor: isDark ? '#1C1C1C' : '#F3F1EC' }]}>
          <SkeletonLoader width="100%" height="100%" borderRadius={28} />
        </View>
        <View style={styles.contentArea}>
          <SkeletonLoader width="75%" height={20} borderRadius={14} />
          <SkeletonLoader width="90%" height={14} borderRadius={10} style={{ marginTop: 12 }} />
          <SkeletonLoader width="40%" height={14} borderRadius={10} style={{ marginTop: 10 }} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.section, { backgroundColor: isDark ? '#0B0B0B' : '#FAF8F2' }]}> 
        <Text style={[styles.heading, { color: isDark ? '#FFFFFF' : '#111111' }]}>Prophet Stories</Text>
        <View style={styles.loadingRow}>
          {[0, 1, 2].map((item) => renderSkeletonCard(item))}
        </View>
      </View>
    );
  }

  if (error && !stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: isDark ? '#0B0B0B' : '#FAF8F2' }]}>
        <Text style={[styles.heading, { color: isDark ? '#FFFFFF' : '#111111' }]}>Prophet Stories</Text>
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
      <View style={[styles.section, { backgroundColor: isDark ? '#0B0B0B' : '#FAF8F2', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#ECECEC' }]}> 
        <Text style={[styles.heading, { color: isDark ? '#FFFFFF' : '#111111' }]}>Prophet Stories</Text>
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
    <View style={[styles.section, { backgroundColor: isDark ? '#0B0B0B' : '#FAF8F2' }]}> 
      <Text style={[styles.heading, { color: isDark ? '#FFFFFF' : '#111111' }]}>Prophet Stories</Text>
      <AnimatedFlatList
        data={stories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardWidth + CARD_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        alwaysBounceHorizontal
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => (
          <ProphetStoryCard
            story={item}
            index={index}
            cardWidth={index === 0 ? cardWidth * 1.03 : cardWidth}
            scrollX={scrollX}
            onPress={handleOpenStory}
            isFeatured={index === 0}
            colors={colors}
            isDark={isDark}
          />
        )}
        ListFooterComponent={<View style={{ width: 20 }} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    marginBottom: 28,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 20,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  listContent: {
    paddingLeft: 20,
    paddingRight: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    paddingLeft: 20,
    gap: CARD_SPACING,
  },
  cardWrapper: {
    marginRight: CARD_SPACING,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  imageFrame: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#E7E5DF',
  },
  imageTranslate: {
    flex: 1,
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
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  imageSkeleton: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  featuredTagIcon: {
    marginRight: 6,
  },
  featuredTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  storyTeaser: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  storyBadge: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  readButton: {
    minWidth: 108,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
