import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const MAX_COLLAPSED = 140;

export default function WitnessCard({ item, index, accent }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 320, delay: index * 45, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 75, delay: index * 45, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const longMessage = (item.message?.length || 0) > MAX_COLLAPSED;
  const displayMessage =
    expanded || !longMessage ? item.message : `${item.message.slice(0, MAX_COLLAPSED).trim()}…`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title}\n\n${item.message}\n\nShared via Faith Frames`,
      });
    } catch {}
  };

  return (
    <Animated.View style={[styles.wrap, { opacity: opacityAnim, transform: [{ translateY }] }]}>
      <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
        {item.imageUrl ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.hero}
              contentFit="cover"
              transition={350}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={styles.heroOverlay}
            />
          </View>
        ) : (
          <LinearGradient colors={['#1a1200', '#2d2000']} style={styles.heroPlaceholder}>
            <Ionicons name="people-outline" size={40} color={accent} />
          </LinearGradient>
        )}

        <View style={styles.body}>
          <View style={[styles.tag, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
            <Text style={[styles.tagText, { color: accent }]}>Testimony</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{displayMessage}</Text>

          {longMessage ? (
            <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
              <Text style={[styles.readMore, { color: accent }]}>
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.footer}>
            <View style={[styles.likesBadge, { backgroundColor: colors.glass }]}>
              <Ionicons name="heart" size={14} color={accent} />
              <Text style={[styles.likesText, { color: colors.textSecondary }]}>{item.likes ?? 0}</Text>
            </View>
            {item.userId ? (
              <Text style={[styles.meta, { color: colors.textMuted }]}>{item.userId}</Text>
            ) : null}
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.glass, borderColor: colors.border }]} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  card: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  heroWrap: { height: 180, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: Spacing.xl },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSizeMD,
    lineHeight: Typography.lineHeightMD,
  },
  readMore: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  likesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  likesText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  meta: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
