// src/components/prayer/MyPrayerStatusCard.js
// Small status strip shown above the Community feed for the signed-in
// user's own pending/rejected submissions. Approved ones need no special
// card — they already render as a normal CommunityPrayerCard in the feed.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATUS_META = {
  pending: {
    icon: 'time-outline',
    color: '#F59E0B',
    label: 'Pending Review',
    message: 'Your prayer request is awaiting approval from our team.',
  },
  rejected: {
    icon: 'close-circle-outline',
    color: '#EF4444',
    label: 'Not Approved',
    message: 'Your prayer request could not be approved because it does not meet our community guidelines.',
  },
};

export default function MyPrayerStatusCard({ item, colors }) {
  const meta = STATUS_META[item?.status] || STATUS_META.pending;

  return (
    <View
      style={[
        styles.outer,
        { backgroundColor: colors.bgCard, borderColor: meta.color + '40' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {item?.title || 'Prayer Request'}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: meta.color + '18' }]}>
            <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={[styles.message, { color: colors.textMuted }]}>{meta.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '700', flex: 1 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  message: { fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 17 },
});
