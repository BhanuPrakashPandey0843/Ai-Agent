// src/components/library/FaithGalleryCard.js
// Minimal "gallery" card — cover image only, nothing else. Used by all four
// Explore Faith listing screens (Gospel/Heroes/Kings/Prophets) so the
// listing stays a pure visual gallery with no titles, descriptions, or
// actions. Tapping a card opens the shared ContentDetail screen, where the
// full reading experience (title, description, related content) lives —
// see screens/ContentDetailScreen.js.
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const FALLBACK_ICON_BY_TYPE = {
  video: 'videocam',
  story: 'book-outline',
  message: 'chatbubble-ellipses-outline',
  image: 'image-outline',
};

export default function FaithGalleryCard({ item, index = 0, accent, onPress }) {
  const { colors, isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  const fallbackIcon = FALLBACK_ICON_BY_TYPE[item?.contentTypeId] || 'document-text-outline';

  // Staggered entrance, mirrors FaithContentCard so Bible still feels part
  // of the same design language even though the card itself is stripped down.
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: (index % 12) * 35,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        friction: 9,
        tension: 70,
        delay: (index % 12) * 35,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 8, tension: 120, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: translateAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onPress?.(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: colors.bgCard }, cardShadow(isDark)]}
        accessibilityRole="imagebutton"
        accessibilityLabel={item?.title || 'Open content'}
      >
        <View style={styles.imageWrap}>
          {item?.thumbnail && !imageError ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.image}
              contentFit="cover"
              transition={280}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback, { backgroundColor: accent + '1F' }]}>
              <Ionicons name={fallbackIcon} size={28} color={accent} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardShadow = (isDark) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: isDark ? 0.35 : 0.08,
  shadowRadius: 10,
  elevation: 4,
});

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
});
