// src/components/prayer/PrayerCategoryChips.js
// Renders only when prayer documents actually have a `category` field —
// no fabricated categories are ever shown.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function PrayerCategoryChips({ categories, selected, onSelect, colors, accent }) {
  if (!categories || !categories.length) return null;
  const all = ['All', ...categories];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {all.map((cat) => {
        const isActive = selected === cat || (selected === null && cat === 'All');
        return (
          <TouchableOpacity
            key={cat}
            activeOpacity={0.85}
            onPress={() => onSelect(cat === 'All' ? null : cat)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? accent + '20' : colors.bgCard,
                borderColor: isActive ? accent : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: isActive ? accent : colors.textSecondary }]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingVertical: 2 },
  chip: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});
