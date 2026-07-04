import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
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

const CARD_WIDTH_RATIO = 0.4;
const CARD_HEIGHT_RATIO = 0.6;
const CARD_SPACING = 16;

export default function FeaturedStoriesSection() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const { items, loading, error, fromCache, retry } = useFirestoreSubscription(
    subscribeToFeaturedStories,
    STORAGE_KEYS.LIBRARY_CACHE_FEATURED_STORIES
  );

  const stories = useMemo(() => items, [items]);

  const cardWidth = Math.round(width * CARD_WIDTH_RATIO);
  const cardHeight = Math.round(cardWidth * CARD_HEIGHT_RATIO);

  const handleOpenStory = (story) => {
    navigation.navigate('ProphetStoryDetails', { storyId: story.id });
  };

  const renderSkeleton = (key) => (
    <View key={key} style={[styles.cardWrapper, { width: cardWidth + CARD_SPACING }]}>
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <SkeletonLoader width="100%" height="100%" borderRadius={24} />
      </View>
      <View style={styles.textContainer}>
        <SkeletonLoader width="70%" height={18} borderRadius={9} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.section, { backgroundColor: colors.bg }]}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Featured Stories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContent}>
          {[0, 1, 2].map(renderSkeleton)}
        </ScrollView>
      </View>
    );
  }

  if (error && !stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: colors.bg }]}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Featured Stories</Text>
        <EmptyState
          icon="cloud-offline-outline"
          title="Unable to load featured stories"
          message={fromCache ? 'Cached stories are unavailable. Check your connection and try again.' : error}
          actionLabel="Retry"
          onAction={retry}
        />
      </View>
    );
  }

  if (!stories.length) {
    return (
      <View style={[styles.section, { backgroundColor: colors.bg }]}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Featured Stories</Text>
        <View style={[styles.emptyState, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="star-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No featured stories yet</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Add featured stories from the admin panel and they will appear here instantly.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: colors.bg }]}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Featured Stories</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stories.map((story, index) => (
          <TouchableOpacity
            key={story.id}
            activeOpacity={0.8}
            onPress={() => handleOpenStory(story)}
          >
            <View style={[styles.cardWrapper, { width: cardWidth + CARD_SPACING }]}>
              <View
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  },
                ]}
              >
                {story.coverimage || story.image ? (
                  <Image
                    source={{ uri: story.coverimage || story.image }}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={[styles.fallbackImage, { backgroundColor: colors.bgCardSoft }]}>
                    <Ionicons name="book-outline" size={48} color={colors.primary} />
                  </View>
                )}

                <LinearGradient
                  colors={[
                    'transparent',
                    isDark ? 'rgba(5,5,12,0.8)' : 'rgba(12,14,30,0.75)',
                  ]}
                  locations={[0.3, 1]}
                  style={styles.imageFade}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {story.title || 'Untitled story'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 20,
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 4,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  textContainer: {
    marginTop: 12,
    width: '100%',
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  emptyState: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
