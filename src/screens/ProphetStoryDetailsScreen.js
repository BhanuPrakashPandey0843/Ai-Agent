import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../context/ThemeContext';
import BackHeader from '../components/common/BackHeader';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import useStoryBookmarks from '../hooks/useStoryBookmarks';
import useStoryLikes from '../hooks/useStoryLikes';
import useStoryRead from '../hooks/useStoryRead';
import { subscribeToStories, subscribeToFeaturedStories } from '../services/firebaseService';
import { STORAGE_KEYS } from '../constants';

const IMAGE_HEIGHT = 320;

export default function ProphetStoryDetailsScreen({ route }) {
  const { storyId } = route.params || {};
  const { colors, isDark, Spacing, Typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { isBookmarked, toggleBookmark } = useStoryBookmarks();
  const { isLiked, toggleLike } = useStoryLikes();
  const { isRead, markRead } = useStoryRead();

  const { items: regularStories, loading: loadingRegular, error: errorRegular } = useFirestoreSubscription(
    subscribeToStories,
    STORAGE_KEYS.LIBRARY_CACHE_STORIES
  );

  const { items: featuredStories, loading: loadingFeatured, error: errorFeatured } = useFirestoreSubscription(
    subscribeToFeaturedStories,
    STORAGE_KEYS.LIBRARY_CACHE_FEATURED_STORIES
  );

  const story = useMemo(() => {
    const allStories = [...regularStories, ...featuredStories];
    return allStories.find((item) => item.id === storyId);
  }, [regularStories, featuredStories, storyId]);

  useEffect(() => {
    if (story && !isRead(story.id)) {
      markRead(story.id);
    }
  }, [story?.id, isRead, markRead]);

  const loading = loadingRegular || loadingFeatured;
  const error = errorRegular || errorFeatured;

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleLike(story.id);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleBookmark(story.id);
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Check out this story: ${story.title}\n${story.description || ''}`,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not share the story');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background || colors.bg }]}>
        <BackHeader title="Story" />
        <View style={styles.loadingContent}>
          <Text style={{ color: colors.textPrimary || colors.text }}>Loading story...</Text>
        </View>
      </View>
    );
  }

  if (error && !story) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background || colors.bg }]}>
        <BackHeader title="Story" />
        <View style={styles.loadingContent}>
          <Text style={{ color: colors.textPrimary || colors.text }}>Error loading story</Text>
        </View>
      </View>
    );
  }

  const metaLabel = story?.category;

  return (
    <View style={[styles.container, { backgroundColor: colors.background || colors.bg }]}>
      <BackHeader title="Story" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          {story?.image ? (
            <Image
              source={{ uri: story.image }}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              style={styles.heroImage}
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.bgCardSoft || colors.bgCard }]}>
              <Ionicons name="book" size={64} color={colors.primary} />
            </View>
          )}

          <LinearGradient
            colors={[
              'transparent',
              isDark ? 'rgba(5,5,12,0.8)' : 'rgba(12,14,30,0.75)',
            ]}
            locations={[0.3, 1]}
            style={styles.heroFade}
          />
        </View>

        <View style={styles.content}>
          {metaLabel ? (
            <Text style={[styles.metaLabel, { color: colors.primary }]}>{metaLabel}</Text>
          ) : null}

          <Text style={[styles.title, { color: colors.textPrimary || colors.text }]}>
            {story?.title || 'Story unavailable'}
          </Text>

          {story?.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {story.description}
            </Text>
          ) : null}

          {story?.content ? (
            <View style={[styles.bodyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.bodyText, { color: colors.textPrimary || colors.text }]}>
                {story.content}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[
        styles.actionBar,
        { 
          backgroundColor: isDark ? 'rgba(5,5,12,0.98)' : 'rgba(255,255,255,0.98)',
          paddingBottom: insets.bottom + 16,
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={handleLike}
        >
          <Ionicons 
            name={isLiked(story.id) ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isLiked(story.id) ? colors.primary : colors.textPrimary} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={handleSave}
        >
          <Ionicons 
            name={isBookmarked(story.id) ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color={isBookmarked(story.id) ? colors.primary : colors.textPrimary} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={handleShare}
        >
          <Ionicons 
            name="share-outline" 
            size={24} 
            color={colors.textPrimary} 
          />
        </TouchableOpacity>

        <View style={[
          styles.readIndicator,
          { 
            backgroundColor: colors.accentSoft,
            borderColor: colors.border,
          }
        ]}>
          <Ionicons 
            name="checkmark-done-circle" 
            size={20} 
            color={colors.primary} 
          />
          <Text style={[styles.readText, { color: colors.primary }]}>
            {isRead(story.id) ? 'Read' : 'Marked as Read'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  bodyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
  },
  readText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
