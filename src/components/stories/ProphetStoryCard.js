// src/components/stories/ProphetStoryCard.js
// Shared Faith Story card used across the Home "Faith Stories" section,
// the full "All Faith Stories" list, and the Favorites screen.
// Centralizing this avoids duplicate card implementations drifting apart.

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SkeletonLoader from '../common/SkeletonLoader';

export const ProphetStoryCard = React.memo(function ProphetStoryCard({
  story,
  onPress,
  colors,
  isDark,
  cardWidth,
  index,
  animateIn = true,
  showDescription = false,
}) {
  const [imageError, setImageError] = React.useState(false);
  const pressScale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const translateY = React.useRef(new Animated.Value(animateIn ? 20 : 0)).current;

  React.useEffect(() => {
    if (!animateIn) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        accessibilityLabel={`Open story ${story?.title || 'faith story'}`}
        accessibilityHint={`Read the story of ${story?.category || 'this faith story'}`}
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
            {!story?.image || imageError ? (
              <View style={[styles.fallbackImage, { backgroundColor: colors.bgCardSoft }]}>
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
                { color: colors.textPrimary, fontSize: titleFontSize, lineHeight: titleFontSize * 1.35 },
              ]}
              numberOfLines={2}
            >
              {story?.title || 'Story'}
            </Text>
            {showDescription && story?.shortdescription ? (
              <Text
                style={[styles.storyDescription, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {story.shortdescription}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export const ProphetStoryCardSkeleton = React.memo(function ProphetStoryCardSkeleton({
  cardWidth,
  colors,
  isDark,
}) {
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
        <View style={[styles.imageContainer, { height: imageHeight, backgroundColor: colors.bgCardSoft }]}>
          <SkeletonLoader width="100%" height="100%" borderRadius={18} />
        </View>
        <View style={styles.titleArea}>
          <SkeletonLoader width="80%" height={18} borderRadius={9} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
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
  storyDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'left',
  },
});
