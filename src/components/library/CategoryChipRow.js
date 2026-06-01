import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

export default function CategoryChipRow({ categories, selected, onSelect, accent }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((cat) => {
        const focused = selected === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              focused && {
                backgroundColor: accent + '18',
                borderColor: accent + '50',
              },
            ]}
          >
            <Text style={[styles.label, { color: focused ? accent : Colors.textMuted }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
});
