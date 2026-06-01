// src/components/home/VerseCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const VERSE_CARD_W = SCREEN_WIDTH * 0.6;
export const VERSE_CARD_H = 240;

const VerseCard = ({
  item,
  index,
  onPress,
  scrollX,
}) => {
  const inputRange = [
    (index - 1) * (VERSE_CARD_W + 16),
    index * (VERSE_CARD_W + 16),
    (index + 1) * (VERSE_CARD_W + 16),
  ];

  const scale = scrollX?.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  }) || 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.container}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={['#14141A', '#0A0A0F']}
            style={styles.image}
          />
        )}
        <LinearGradient
          colors={Colors.gradientOverlay}
          style={styles.overlay}
        />
        <View style={styles.content}>
          <Text style={styles.title}>
            {item.title || item.verseText || item.text?.substring(0, 30) || 'Daily Verse'}
          </Text>
          {item.verseReference && (
            <Text style={styles.reference}>{item.verseReference}</Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: VERSE_CARD_W,
    height: VERSE_CARD_H,
    marginRight: Spacing.lg,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    lineHeight: 24,
    marginBottom: 4,
  },
  reference: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default VerseCard;
