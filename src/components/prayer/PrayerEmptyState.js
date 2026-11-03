// src/components/prayer/PrayerEmptyState.js
// Elegant empty state with an optional call-to-action button.
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function PrayerEmptyState({ icon, title, message, actionLabel, onAction, colors, accent }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { borderColor: accent + '40', backgroundColor: accent + '12' }]}>
        <Ionicons name={icon || 'hand-left-outline'} size={30} color={accent} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
          style={[styles.btn, { backgroundColor: accent }]}
        >
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default memo(PrayerEmptyState);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  message: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', fontWeight: '500' },
  btn: { marginTop: 18, height: 42, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
