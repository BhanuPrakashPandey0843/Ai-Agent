import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function LeaderboardRow({ entry }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.bgCard }]}>
      <Text style={[styles.rank, { color: colors.textMuted }]}>{entry.rank}</Text>
      {entry.photoURL ? (
        <Image source={{ uri: entry.photoURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder, { backgroundColor: isDark ? '#1A1A33' : '#EDE8DC' }]} />
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {entry.displayName || 'Player'}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {entry.accuracy}% · {Math.round((entry.completionTimeMs || 0) / 1000)}s
        </Text>
      </View>
      <Text style={[styles.score, { color: colors.primary }]}>{entry.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  rank: { width: 28, fontWeight: '800', textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  placeholder: { },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  score: { fontSize: 18, fontWeight: '800' },
});
