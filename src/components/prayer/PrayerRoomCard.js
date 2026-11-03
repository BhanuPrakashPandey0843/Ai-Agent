// src/components/prayer/PrayerRoomCard.js
// Compact, premium prayer card used everywhere below the search bar.
//
// Hierarchy (top to bottom): category badge -> title -> short text ->
// prayer-specific info -> hairline divider -> small icon actions.
// One component serves three kinds of prayer:
//   personal  - the user's own private prayer
//   community - an approved community prayer request (supports "Pray")
//   admin     - a prayer shared by the FaithFrames team
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const BADGES = {
  personal: { label: 'Personal Prayer', icon: 'lock-closed-outline' },
  community: { label: 'Community Prayer', icon: 'people-outline' },
  admin: { label: 'Daily Prayer', icon: 'sunny-outline' },
};

const HIT = { top: 5, bottom: 5, left: 5, right: 5 };

function IconButton({ name, label, onPress, color, backgroundColor, borderColor, scale }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={HIT}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.iconBtn, { backgroundColor, borderColor }]}
    >
      <Animated.View style={scale ? { transform: [{ scale }] } : null}>
        <Ionicons name={name} size={17} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function Meta({ icon, text, color, flex }) {
  return (
    <View style={[styles.meta, flex && { flex: 1 }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.metaText, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function PrayerRoomCard({
  item,
  index = 0,
  colors,
  accent,
  isDark,
  isBookmarked,
  dateLabel,
  onBookmark,
  onShare,
  onCopy,
  onOpen,
  onMenu,
  onPray,
  praying,
  prayReady,
  prayBusy,
  prayCount,
}) {
  const badge = BADGES[item.kind] || BADGES.community;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const copyTimer = useRef(null);

  // Subtle entrance (native driver, staggered for the first few cards only).
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 280,
      delay: Math.min(index, 6) * 45,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  // Bookmark "pop" on change (skipped for the initial render).
  const pulse = useRef(new Animated.Value(1)).current;
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.3, speed: 40, bounciness: 14, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, speed: 40, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, [isBookmarked, pulse]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  const full = String(item.verse || '').trim();
  const summary = String(item.description || '').trim() || full;
  const expandable = full.length > 0 && (full !== summary || full.length > 150);
  const shownText = expanded && !onOpen ? full : summary;
  const title = item.title || (item.kind === 'admin' ? 'Daily Prayer' : 'Prayer');
  const imageUrl = String(item.bgurl || item.image || item.imageUrl || '').trim();
  const showImage = item.kind === 'admin' && !!imageUrl && !imageFailed;

  const handlePress = useCallback(() => {
    if (onOpen) onOpen(item);
    else if (expandable) setExpanded((v) => !v);
  }, [onOpen, item, expandable]);

  const handleCopy = useCallback(async () => {
    const ok = await onCopy(item);
    if (ok === false) return;
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }, [onCopy, item]);

  const cardBg = isDark ? colors.bgCard : '#FFFBF6';
  const iconBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';
  const iconBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const muted = colors.textMuted;

  let info = null;
  if (item.kind === 'community') {
    info = (
      <View style={styles.infoRow}>
        {item.anonymous ? (
          <Meta icon="eye-off-outline" text="Anonymous" color={muted} flex />
        ) : item.username ? (
          <Meta icon="person-outline" text={item.username} color={muted} flex />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Meta icon="chatbubble-outline" text={String(Number(item.commentCount || 0))} color={muted} />
      </View>
    );
  } else if (item.kind === 'personal') {
    info = (
      <View style={styles.infoRow}>
        <Meta icon="lock-closed-outline" text="Only visible to you" color={muted} flex />
      </View>
    );
  } else if (item.reference) {
    info = (
      <View style={styles.infoRow}>
        <Meta icon="book-outline" text={item.reference} color={accent} flex />
      </View>
    );
  } else if (item.kind === 'admin') {
    info = (
      <View style={styles.infoRow}>
        <Meta icon="sparkles-outline" text="Shared by the FaithFrames team" color={muted} flex />
      </View>
    );
  }

  const animStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  return (
    <Animated.View
      style={[
        styles.shadowWrap,
        { shadowOpacity: isDark ? 0.35 : 0.07, shadowColor: '#000' },
        animStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`${badge.label}: ${title}`}
        style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}
      >
        {/* Header: badge + date + owner menu */}
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: colors.accentSoft, borderColor: colors.borderAccent }]}>
            <Ionicons name={badge.icon} size={11} color={accent} />
            <Text style={[styles.badgeText, { color: accent }]}>{badge.label}</Text>
          </View>
          <View style={styles.headerRight}>
            {dateLabel ? <Text style={[styles.dateText, { color: muted }]}>{dateLabel}</Text> : null}
            {onMenu ? (
              <TouchableOpacity
                onPress={() => onMenu(item)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Prayer options"
                style={styles.menuBtn}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Title (+ optional thumbnail) and text */}
        <View style={styles.bodyRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
              {title}
            </Text>
            {shownText ? (
              <Text
                style={[styles.text, { color: colors.textSecondary }]}
                numberOfLines={expanded && !onOpen ? undefined : 3}
              >
                {shownText}
              </Text>
            ) : null}
            {expandable ? (
              <Text style={[styles.readMore, { color: accent }]}>
                {onOpen || !expanded ? 'Read more' : 'Show less'}
              </Text>
            ) : null}
          </View>
          {showImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.thumb, { backgroundColor: colors.bgCardSoft }]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
            />
          ) : null}
        </View>

        {info}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.iconGroup}>
            <IconButton
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              label={isBookmarked ? 'Remove from saved prayers' : 'Save prayer'}
              onPress={() => onBookmark(item)}
              color={isBookmarked ? accent : colors.textSecondary}
              backgroundColor={isBookmarked ? colors.accentSoft : iconBg}
              borderColor={isBookmarked ? accent : iconBorder}
              scale={pulse}
            />
            <IconButton
              name="share-social-outline"
              label="Share prayer"
              onPress={() => onShare(item)}
              color={colors.textSecondary}
              backgroundColor={iconBg}
              borderColor={iconBorder}
            />
            <IconButton
              name={copied ? 'checkmark' : 'copy-outline'}
              label="Copy prayer"
              onPress={handleCopy}
              color={copied ? colors.success : colors.textSecondary}
              backgroundColor={copied ? colors.success + '1F' : iconBg}
              borderColor={copied ? colors.success : iconBorder}
            />
          </View>

          {onPray ? (
            <TouchableOpacity
              onPress={() => onPray(item)}
              disabled={!prayReady || prayBusy}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel={praying ? "You're praying for this request" : 'Tap to say you are praying'}
              style={[
                styles.prayBtn,
                {
                  borderColor: praying ? accent : colors.border,
                  backgroundColor: praying ? colors.accentSoft : 'transparent',
                  opacity: prayReady ? 1 : 0.55,
                },
              ]}
            >
              {prayBusy ? (
                <ActivityIndicator size="small" color={accent} style={styles.prayIcon} />
              ) : (
                <Ionicons
                  name={praying ? 'hand-left' : 'hand-left-outline'}
                  size={15}
                  color={praying ? accent : colors.textSecondary}
                  style={styles.prayIcon}
                />
              )}
              <Text style={[styles.prayText, { color: praying ? accent : colors.textSecondary }]}>
                {praying ? 'Praying' : 'Pray'}
              </Text>
              <Text style={[styles.prayCount, { color: muted }]}>{Number(prayCount || 0)}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(PrayerRoomCard);

const styles = StyleSheet.create({
  shadowWrap: {
    marginBottom: 12,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 1.5,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 24,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 1,
  },
  badgeText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
  dateText: { fontSize: 11, fontWeight: '600' },
  menuBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  bodyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 21, marginBottom: 3 },
  text: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },
  readMore: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5, fontWeight: '600', flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 10, marginBottom: 9 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
  },
  prayIcon: { width: 15, height: 15 },
  prayText: { fontSize: 12.5, fontWeight: '700' },
  prayCount: { fontSize: 12, fontWeight: '700' },
});
