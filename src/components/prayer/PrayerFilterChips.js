// src/components/prayer/PrayerFilterChips.js
// Compact filter row (All / Personal / Community / Saved). Works together with
// the search query: the screen applies both.
import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function PrayerFilterChips({ options, value, onChange, colors, accent }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label} prayers filter`}
            style={[
              styles.chip,
              {
                backgroundColor: active ? accent : colors.bgCard,
                borderColor: active ? accent : colors.border,
              },
            ]}
          >
            {opt.icon ? (
              <Ionicons name={opt.icon} size={13} color={active ? '#FFFFFF' : colors.textSecondary} />
            ) : null}
            <Text style={[styles.label, { color: active ? '#FFFFFF' : colors.textSecondary }]}>{opt.label}</Text>
            {typeof opt.count === 'number' && opt.count > 0 ? (
              <View
                style={[
                  styles.count,
                  { backgroundColor: active ? 'rgba(255,255,255,0.28)' : colors.accentSoft },
                ]}
              >
                <Text style={[styles.countText, { color: active ? '#FFFFFF' : accent }]}>{opt.count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default memo(PrayerFilterChips);

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 12.5, fontWeight: '700' },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 10.5, fontWeight: '800' },
});
