// src/components/prayer/CommunityPrayerCard.js
// Compact card for an approved community prayer request. Matches the visual
// language of PrayerCard.js (soft gradient card, accent badge, hairline
// divider actions row) but sized for a vertical list instead of a swipeable
// full-bleed carousel item.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityPrayerCard({
  item,
  colors,
  accent,
  isPraying,
  prayBusy,
  onPress,
  onPray,
}) {
  const excerpt = item?.description?.trim() || item?.content?.trim() || '';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityLabel={`Prayer request: ${item?.title || 'Untitled'}`}
      style={styles.outer}
    >
      <LinearGradient
        colors={[colors.bgCard, colors.bgCardSoft]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          {item?.category ? (
            <View style={[styles.badge, { borderColor: accent }]}>
              <Text style={[styles.badgeText, { color: accent }]} numberOfLines={1}>
                {item.category.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {item?.anonymous ? (
            <View style={styles.anonRow}>
              <Ionicons name="eye-off-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.anonText, { color: colors.textMuted }]}>Anonymous</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item?.title || 'Prayer Request'}
        </Text>

        {excerpt ? (
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={3}>
            {excerpt}
          </Text>
        ) : null}

        {!item?.anonymous && item?.username ? (
          <Text style={[styles.byline, { color: colors.textMuted }]}>— {item.username}</Text>
        ) : null}

        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.prayBtn,
              { backgroundColor: colors.bg, borderColor: colors.border },
              isPraying && { backgroundColor: accent + '20', borderColor: accent },
            ]}
            onPress={onPray}
            disabled={prayBusy}
            activeOpacity={0.8}
            accessibilityLabel={isPraying ? "You're praying for this" : "Tap to say you're praying"}
          >
            <Ionicons
              name={isPraying ? 'hand-left' : 'hand-left-outline'}
              size={16}
              color={isPraying ? accent : colors.textSecondary}
            />
            <Text
              style={[
                styles.prayBtnText,
                { color: isPraying ? accent : colors.textSecondary },
              ]}
            >
              {isPraying ? "I'm Praying" : 'Pray for this'}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="hand-left-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {Number(item?.prayCount || 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {Number(item?.commentCount || 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  content: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  anonText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 6, lineHeight: 23 },
  body: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },
  byline: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  prayBtnText: { fontSize: 12.5, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 14 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '700' },
});
