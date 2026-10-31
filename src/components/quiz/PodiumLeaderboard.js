import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

function PodiumSlot({ entry, place, height, colors, isDark }) {
  const medals = { 1: 'medal', 2: 'medal-outline', 3: 'medal-outline' };
  const podiumColors = { 1: '#F5C842', 2: '#B0BEC5', 3: '#CD7F32' };
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [entry?.photoURL]);

  return (
    <View style={styles.slot}>
      {entry?.photoURL && !imageFailed ? (
        <Image source={{ uri: entry.photoURL }} style={styles.avatar} onError={() => setImageFailed(true)} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#1A1A33' : '#EDE8DC' }]}>
          <MaterialCommunityIcons name="account" size={28} color={colors.textMuted} />
        </View>
      )}
      <MaterialCommunityIcons
        name={medals[place]}
        size={22}
        color={podiumColors[place]}
        style={styles.medal}
      />
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {entry?.displayName || '—'}
      </Text>
      <Text style={[styles.score, { color: colors.primary }]}>{entry?.score ?? 0}</Text>
      <View style={[styles.podium, { height, backgroundColor: podiumColors[place] }]} />
    </View>
  );
}

export default function PodiumLeaderboard({ entries }) {
  const { colors, isDark } = useTheme();
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);
  const podiumEntries = [second, first, third].filter(Boolean);

  return (
    <View style={styles.row}>
      {podiumEntries.map((entry) => (
        <PodiumSlot
          key={entry.uid || entry.id}
          entry={entry}
          place={entry.rank}
          height={entry.rank === 1 ? 96 : entry.rank === 2 ? 72 : 60}
          colors={colors}
          isDark={isDark}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  slot: { flex: 1, alignItems: 'center', maxWidth: 120 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 4,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: { marginBottom: 4 },
  name: { fontSize: 12, fontWeight: '700', maxWidth: '100%' },
  score: { fontSize: 14, fontWeight: '800', marginVertical: 4 },
  podium: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 6,
    opacity: 0.85,
  },
});
