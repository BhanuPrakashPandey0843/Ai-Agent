// src/components/prayer/PrayerSectionHeader.js
// Compact section heading with subtle metadata (e.g. "3 prayers").
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

function PrayerSectionHeader({ title, meta, subtitle, colors }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {meta ? <Text style={[styles.meta, { color: colors.textMuted }]}>{meta}</Text> : null}
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export default memo(PrayerSectionHeader);

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  meta: { fontSize: 12, fontWeight: '600' },
  subtitle: { fontSize: 12.5, fontWeight: '500', lineHeight: 18, marginTop: 3 },
});
