import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

export default function QuoteCard({ item, index, accent, onShare }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 80, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, [index, opacityAnim, translateY]);

  const authorLine = item.author?.trim()
    ? `— ${item.author}`
    : item.category && item.category !== 'General'
      ? item.category
      : null;

  const inner = (
    <>
      <Text style={styles.bigQuote}>"</Text>
      {item.category ? (
        <View style={[styles.categoryPill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
          <Text style={[styles.categoryText, { color: accent }]}>{item.category}</Text>
        </View>
      ) : null}
      <Text style={styles.quoteText}>{item.text}</Text>
      {authorLine ? <Text style={[styles.author, { color: accent }]}>{authorLine}</Text> : null}
      <TouchableOpacity style={styles.shareBtn} onPress={() => onShare(item)} activeOpacity={0.8}>
        <Ionicons name="share-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </>
  );

  return (
    <Animated.View style={[styles.wrap, { opacity: opacityAnim, transform: [{ translateY }] }]}>
      {item.bgurl ? (
        <View style={styles.card}>
          <Image
            source={{ uri: item.bgurl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardInner}>{inner}</View>
        </View>
      ) : (
        <LinearGradient
          colors={[Colors.bgCard, Colors.bgCardLight]}
          style={[styles.card, styles.cardSolid]}
        >
          <View style={styles.cardInner}>{inner}</View>
        </LinearGradient>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  card: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    minHeight: 160,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSolid: {
    padding: Spacing.xl,
  },
  cardInner: {
    padding: Spacing.xl,
    position: 'relative',
  },
  bigQuote: {
    position: 'absolute',
    top: 4,
    right: 16,
    fontSize: 64,
    color: '#FFF',
    opacity: 0.06,
    fontFamily: 'serif',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quoteText: {
    fontSize: Typography.fontSizeLG,
    color: Colors.textPrimary,
    lineHeight: 28,
    fontWeight: Typography.fontWeightMedium,
    paddingRight: Spacing.xxl,
  },
  author: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  shareBtn: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
