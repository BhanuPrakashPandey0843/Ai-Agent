import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');
export const SWIPE_CARD_W = SCREEN_W - 40;

export default function SwipeContentCard({
  item,
  index,
  accent,
  tagLabel,
  tagIcon = 'book-outline',
  bodyText,
  reference,
  bgurl,
  gradients,
  isBookmarked,
  onBookmark,
  onShare,
  onCopy,
}) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacityAnim, scaleAnim]);

  const gradient = gradients[index % gradients.length];

  const content = (
    <View style={styles.cardInner}>
      <Text style={styles.bigQuote}>"</Text>

      <View style={[styles.tag, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
        <Ionicons name={tagIcon} size={11} color={accent} />
        <Text style={[styles.tagText, { color: accent }]}>{tagLabel}</Text>
      </View>

      <Text style={styles.bodyText}>{bodyText}</Text>

      {reference ? (
        <View style={styles.refRow}>
          <View style={[styles.refLine, { backgroundColor: accent + '30' }]} />
          <Text style={[styles.refText, { color: accent }]}>{reference}</Text>
          <View style={[styles.refLine, { backgroundColor: accent + '30' }]} />
        </View>
      ) : null}

      <View style={styles.cardActions}>
        {onBookmark ? (
          <TouchableOpacity
            style={[styles.actionBtn, isBookmarked && { backgroundColor: accent + '25', borderColor: accent + '50' }]}
            onPress={() => onBookmark(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={isBookmarked ? accent : Colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
        {onShare ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={17} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
        {onCopy ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onCopy(item)} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={17} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {bgurl ? (
        <View style={styles.cardBgWrap}>
          <Image
            source={{ uri: bgurl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
            onError={() => {}}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0.93)']}
            style={StyleSheet.absoluteFill}
          />
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.cardBgWrap}
        >
          <View style={[styles.blob, { top: -40, right: -20, backgroundColor: accent + '18' }]} />
          <View
            style={[
              styles.blob,
              { bottom: 20, left: -30, width: 100, height: 100, backgroundColor: accent + '10' },
            ]}
          />
          {content}
        </LinearGradient>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: SWIPE_CARD_W,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  cardBgWrap: {
    minHeight: 340,
    justifyContent: 'center',
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  cardInner: { zIndex: 2 },
  bigQuote: {
    position: 'absolute',
    top: -20,
    left: -8,
    fontSize: 100,
    color: '#FFFFFF',
    opacity: 0.05,
    fontFamily: 'serif',
    lineHeight: 100,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 11,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  tagText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 30,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 0.1,
    marginBottom: 24,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  refLine: { flex: 1, height: 1 },
  refText: {
    fontSize: 13,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.2,
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
