// src/components/library/FaithContentCard.js
// Vertical content card shared by the Bible / Jesus / Prayers / Worship
// screens. Adapts its overlay to the admin-selected contentTypeId (story /
// message / image / video) while keeping the same premium visual language
// as the Witness Videos card it's modeled on.
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import useContentInteraction from '../../hooks/useContentInteraction';

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

const OVERLAY_ICON_BY_TYPE = {
  video: 'play',
  story: 'book',
  message: 'chatbubble-ellipses',
  image: null,
};

const FALLBACK_ICON_BY_TYPE = {
  video: 'videocam',
  story: 'book-outline',
  message: 'chatbubble-ellipses-outline',
  image: 'image-outline',
};

export default function FaithContentCard({ kind, item, index = 0, accent, onPress }) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  const { liked, disliked, saved, likeCount, dislikeCount, like, dislike, toggleSave } =
    useContentInteraction(kind, item);

  const contentType = item?.contentTypeId || 'story';
  const overlayIcon = OVERLAY_ICON_BY_TYPE[contentType] ?? 'book';
  const fallbackIcon = FALLBACK_ICON_BY_TYPE[contentType] || 'document-text-outline';

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 320, delay: index * 40, useNativeDriver: true }),
      Animated.spring(translateAnim, { toValue: 0, friction: 9, tension: 70, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: item.videoUrl
          ? `${item.title} — Faith Frames\n${item.videoUrl}`
          : `${item.title} — Faith Frames`,
      });
    } catch {
      // user cancelled or share failed — no-op
    }
  };

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: translateAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress?.(item)}
        style={[styles.card, { backgroundColor: colors.bgCard }, cardShadow]}
      >
        <View style={styles.thumbWrap}>
          {item.thumbnail && !imageError ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumb}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: accent + '20' }]}>
              <Ionicons name={fallbackIcon} size={30} color={accent} />
            </View>
          )}

          {overlayIcon ? (
            <View style={styles.playOverlay}>
              <View style={styles.playCircle}>
                <Ionicons name={overlayIcon} size={20} color="#FFFFFF" />
              </View>
            </View>
          ) : null}

          {item.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          ) : null}

          {item.isPremium ? (
            <View style={[styles.featuredBadge, { backgroundColor: accent }]}>
              <Ionicons name="star" size={11} color="#FFFFFF" />
              <Text style={styles.featuredText}>Premium</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.scriptPassage ? (
            <Text style={[styles.scriptPassage, { color: accent }]} numberOfLines={1}>
              {item.scriptPassage}
            </Text>
          ) : null}
          {item.description ? (
            <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatCount(item.views)} views
            </Text>
          </View>

          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={like} hitSlop={hitSlop}>
              <Ionicons
                name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={liked ? accent : colors.textMuted}
              />
              <Text style={[styles.actionText, { color: liked ? accent : colors.textMuted }]}>
                {formatCount(likeCount)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={dislike} hitSlop={hitSlop}>
              <Ionicons
                name={disliked ? 'thumbs-down' : 'thumbs-down-outline'}
                size={18}
                color={disliked ? colors.error : colors.textMuted}
              />
              <Text style={[styles.actionText, { color: disliked ? colors.error : colors.textMuted }]}>
                {formatCount(dislikeCount)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={toggleSave} hitSlop={hitSlop}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={saved ? accent : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} hitSlop={hitSlop}>
              <Ionicons name="share-social-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 4,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryText: { color: '#FFFFFF', fontSize: 11, fontWeight: Typography.fontWeightBold },
  featuredBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredText: { color: '#FFFFFF', fontSize: 10, fontWeight: Typography.fontWeightBold },
  body: { padding: Spacing.lg },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    lineHeight: 22,
    marginBottom: 4,
  },
  scriptPassage: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    marginBottom: 4,
  },
  desc: {
    fontSize: Typography.fontSizeSM,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  metaText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightMedium },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },
});
