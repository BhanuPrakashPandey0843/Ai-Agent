import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function CategoryFilterChip({ label, icon, color, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipOn]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={active ? color || H.orange : H.textMuted}
        />
      ) : null}
      <Text style={[styles.text, active && { color: color || H.orange, fontWeight: '700' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: H.surface,
    borderWidth: 1,
    borderColor: '#EDE8DC',
    gap: 6,
  },
  chipOn: {
    backgroundColor: '#E8EFFF',
    borderColor: H.primary,
  },
  text: {
    fontSize: 13,
    color: H.textMuted,
    fontWeight: '600',
  },
});
