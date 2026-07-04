import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import BackHeader from '../components/common/BackHeader';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { subscribeToStories, subscribeToFeaturedStories } from '../services/firebaseService';
import { STORAGE_KEYS } from '../constants';

const IMAGE_HEIGHT = 320;

export default function ProphetStoryDetailsScreen({ route }) {
  const { storyId } = route.params || {};
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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

  const loading = loadingRegular || loadingFeatured;
  const error = errorRegular || errorFeatured;

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

  const metaLabel = story?.prophetName ? `Prophet ${story.prophetName} (A.S.)` : story?.category;

  return (
    <View style={[styles.container, { backgroundColor: colors.background || colors.bg }]}>
      <BackHeader title="Story" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
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
            <View style={[styles.heroImage, { backgroundColor: colors.bgCardSoft }]}>
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
});
