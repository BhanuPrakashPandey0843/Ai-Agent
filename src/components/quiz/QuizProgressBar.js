import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function QuizProgressBar({ progress }) {
  const pct = `${Math.min(100, Math.max(0, progress * 100))}%`;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: pct }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EDE8DC',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: H.primary,
    borderRadius: 4,
  },
});
