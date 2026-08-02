// src/components/home/ProphetStoryCard.js
// Shared story card used by ProphetStoriesSection (Home) and AllFaithStoriesScreen.
// Single implementation to avoid duplicated card logic across screens.

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const ProphetStoryCard = React.memo(function ProphetStoryCard({
  story,
  onPress,
  colors,
  isDark,
  cardWidth,
  index = 0,
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
        accessibilityHint={`Read the story of ${story.category || 'a prophet'}`}
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
            {story.description ? (
              <Text
                style={[styles.storyDescription, { color: colors.textMuted }]}
                numberOfLines={2}
              >
                {story.description}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export const SkeletonProphetStoryCard = React.memo(function SkeletonProphetStoryCard({
  cardWidth,
  colors,
  isDark,
  SkeletonLoader,
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
    gap: 3,
  },
  storyTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'left',
  },
  storySubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  storyDescription: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ProphetStoryCard;
