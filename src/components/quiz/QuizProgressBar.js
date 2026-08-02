import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius } from '../../theme/colors';

export default function QuizProgressBar({ progress }) {
  const { colors, isDark } = useTheme();
  const pct = `${Math.min(100, Math.max(0, progress * 100))}%`;
  return (
    <View style={[styles.track, { backgroundColor: isDark ? '#1A1A33' : '#EDE8DC' }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
});
