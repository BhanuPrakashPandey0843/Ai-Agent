import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

export default function LeaderboardRow({ entry }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{entry.rank}</Text>
      {entry.photoURL ? (
        <Image source={{ uri: entry.photoURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.displayName || 'Player'}
        </Text>
        <Text style={styles.meta}>
          {entry.accuracy}% · {Math.round((entry.completionTimeMs || 0) / 1000)}s
        </Text>
      </View>
      <Text style={styles.score}>{entry.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: H.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    ...H.shadow,
  },
  rank: { width: 28, fontWeight: '800', color: H.textMuted, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  placeholder: { backgroundColor: '#EDE8DC' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: H.text },
  meta: { fontSize: 12, color: H.textMuted, marginTop: 2 },
  score: { fontSize: 18, fontWeight: '800', color: H.primary },
});
