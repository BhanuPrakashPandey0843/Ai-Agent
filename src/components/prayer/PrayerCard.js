// src/components/prayer/PrayerCard.js
// Premium devotional-style prayer card — replaces the old flat purple card.
// Reads: item.verse, item.reference, item.id. Bookmark/share/copy handlers
// are passed in from the screen and reuse the exact same underlying logic
// (storage bookmark toggling, Share API, Clipboard) as before.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');
export const PRAYER_CARD_W = SCREEN_W - 40;

export default function PrayerCard({ item, colors, accent, isBookmarked, onBookmark, onShare, onCopy }) {
  const paragraphs = (item?.verse || '').split(/\n\s*\n/).filter(Boolean);

  return (
    <View style={[styles.outer, { shadowColor: '#000' }]}>
      <LinearGradient
        colors={[colors.bgCard, colors.bgCardSoft]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* subtle decorative accents — max 5% opacity, never distracts from text */}
      <View pointerEvents="none" style={[styles.blobTop, { backgroundColor: accent }]} />
      <View pointerEvents="none" style={[styles.blobBottom, { backgroundColor: accent }]} />

      <View style={styles.content}>
        <View style={[styles.badge, { borderColor: accent }]}>
          <Ionicons name="hand-left-outline" size={12} color={accent} />
          <Text style={[styles.badgeText, { color: accent }]}>DAILY PRAYER</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Daily Prayer</Text>

        {paragraphs.length ? (
          paragraphs.map((p, i) => (
            <Text
              key={i}
              style={[
                styles.body,
                { color: colors.textSecondary, marginBottom: i === paragraphs.length - 1 ? 4 : 18 },
              ]}
            >
              {p.trim()}
            </Text>
          ))
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>{item?.verse}</Text>
        )}

        {item?.reference ? (
          <View style={styles.refRow}>
            <View style={[styles.refLine, { backgroundColor: accent + '40' }]} />
            <Text style={[styles.refText, { color: accent }]}>{item.reference}</Text>
            <View style={[styles.refLine, { backgroundColor: accent + '40' }]} />
          </View>
        ) : null}

        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.bg, borderColor: colors.border },
              isBookmarked && { backgroundColor: accent + '20', borderColor: accent },
            ]}
            onPress={onBookmark}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={isBookmarked ? accent : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={onShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={onCopy}
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: PRAYER_CARD_W,
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  blobTop: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -50,
    opacity: 0.05,
  },
  blobBottom: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -50,
    left: -40,
    opacity: 0.05,
  },
  content: { padding: 28 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 23, fontWeight: '700', marginBottom: 16 },
  body: { fontSize: 18, lineHeight: 30, fontWeight: '500' },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 22 },
  refLine: { flex: 1, height: 1 },
  refText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
