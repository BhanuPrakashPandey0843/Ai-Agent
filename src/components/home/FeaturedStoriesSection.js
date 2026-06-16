import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import useFirestoreSubscription from '../../hooks/useFirestoreSubscription';
import { subscribeToFeaturedStories } from '../../services/firebaseService';
import { STORAGE_KEYS } from '../../constants';
import SkeletonLoader from '../common/SkeletonLoader';
import EmptyState from '../common/EmptyState';

const AnimatedFlatList = Animated.FlatList;
const CARD_WIDTH_RATIO = 0.84;
const CARD_HEIGHT = 280;
const CARD_SPACING = 20;

export default function FeaturedStoriesSection() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * CARD_WIDTH_RATIO);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { items, loading, error, fromCache, refresh, retry } = useFirestoreSubscription(
    subscribeToFeaturedStories,
    STORAGE_KEYS.LIBRARY_CACHE_FEATURED_STORIES
  );

  const stories = useMemo(() => items, [items]);

  useEffect(() => {
    if (!stories.length) return undefined;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % stories.length;
      setActiveIndex(nextIndex);
      if (scrollRef.current) {
        scrollRef.current.scrollToOffset({
          offset: nextIndex * (cardWidth + CARD_SPACING),
          animated: true,
        });
      }
    }, 5500);
    return () => clearInterval(interval);
  }, [activeIndex, stories.length, cardWidth]);

  const handleOpenStory = (story) => {
    navigation.navigate('ProphetStoryDetails', { storyId: story.id });
  };

  const renderSkeleton = (key) => (
    <View key={key} style={[styles.cardWrapper, { width: cardWidth }]}> 
      <View style={[styles.card, { backgroundColor: isDark ? '#111' : '#FFF' }]}> 
        <View style={[styles.imageFrame, { backgroundColor: isDark ? '#1C1C1C' : '#F3F1EC' }]}>
          <SkeletonLoader width="100%" height="100%" borderRadius={28} />
        </View>
        <View style={styles.loaderContent}>
          <SkeletonLoader width="70%" height={24} borderRadius={14} />
          <SkeletonLoader width="95%" height={14} borderRadius={10} style={{ marginTop: 10 }} />
          <SkeletonLoader width="60%" height={14} borderRadius={10} style={{ marginTop: 10 }} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.section, { backgroundColor: isDark ? '#080808' : '#FBFAF5' }]}> 
        <Text style={[styles.heading, { color: isDark ? '#FFF' : '#111' }]}>Featured Stories</Text>
        <View style={styles.loadingRow}>
          {[0, 1].map(renderSkeleton)}
        </View>
      </View>
    );
  }

  if (error && !stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: isDark ? '#080808' : '#FBFAF5' }]}>
        <Text style={[styles.heading, { color: isDark ? '#FFF' : '#111' }]}>Featured Stories</Text>
        <EmptyState
          icon="cloud-offline-outline"
          title="Unable to load featured stories"
          message={fromCache ? 'Showing cached stories is unavailable. Check your connection and try again.' : error}
          actionLabel="Retry"
          onAction={retry}
        />
      </View>
    );
  }

  if (!stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: isDark ? '#080808' : '#FBFAF5' }]}> 
        <Text style={[styles.heading, { color: isDark ? '#FFF' : '#111' }]}>Featured Stories</Text>
        <View style={[styles.emptyState, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#ECECEC' }]}> 
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No featured stories yet</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>Add featured stories from the admin panel and they will appear here instantly.</Text>
          <TouchableOpacity onPress={refresh} style={[styles.emptyButton, { backgroundColor: colors.primary }]}> 
            <Text style={styles.emptyButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: isDark ? '#080808' : '#FBFAF5' }]}> 
      <Text style={[styles.heading, { color: isDark ? '#FFF' : '#111' }]}>Featured Stories</Text>
      <AnimatedFlatList
        ref={scrollRef}
        data={stories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardWidth + CARD_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * (cardWidth + CARD_SPACING),
            index * (cardWidth + CARD_SPACING),
            (index + 1) * (cardWidth + CARD_SPACING),
          ];
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [0, -14, 0],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.7, 1, 0.7],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.cardWrapper,
                { width: cardWidth, transform: [{ translateY }], opacity },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => handleOpenStory(item)}
                style={[styles.card, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}
              >
                <View style={styles.imageFrame}>
                  {item.coverimage || item.image ? (
                    <Image
                      source={{ uri: item.coverimage || item.image }}
                      contentFit="cover"
                      transition={320}
                      cachePolicy="memory-disk"
                      style={styles.image}
                    />
                  ) : (
                    <View style={[styles.fallbackImage, { backgroundColor: isDark ? '#1F1F1F' : '#F7F3EC' }]}> 
                      <Ionicons name="book-outline" size={46} color={isDark ? '#FFF' : '#555'} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.75)']}
                    style={styles.imageOverlay}
                  />
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{item.name || item.prophetName || 'Prophet Story'}</Text>
                  </View>
                </View>

                <View style={styles.contentArea}>
                  <Text style={[styles.featuredTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title || 'Untitled story'}
                  </Text>
                  <Text style={[styles.featuredTeaser, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.shortdescription || 'A powerful story from the prophets.'}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.readTime, { color: colors.primary }]}>{item.readingtime || '5 min'}</Text>
                    <View style={styles.readButton}>
                      <Text style={styles.readButtonText}>Read Story</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ListFooterComponent={<View style={{ width: 20 }} />}
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  imageFrame: {
    width: '100%',
    height: 170,
    overflow: 'hidden',
    backgroundColor: '#E7E5DF',
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
  metaChip: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  featuredTeaser: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  readTime: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readButton: {
    borderRadius: 999,
    backgroundColor: '#558AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  readButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loaderContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyState: {
    marginTop: 18,
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
