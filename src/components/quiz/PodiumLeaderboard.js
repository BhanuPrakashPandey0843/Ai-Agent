import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';

const H = HomeTheme;

function PodiumSlot({ entry, place, height }) {
  const medals = { 1: 'medal', 2: 'medal-outline', 3: 'medal-outline' };
  const colors = { 1: '#F5C842', 2: '#B0BEC5', 3: '#CD7F32' };

  return (
    <View style={styles.slot}>
      {entry?.photoURL ? (
        <Image source={{ uri: entry.photoURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialCommunityIcons name="account" size={28} color={H.textMuted} />
        </View>
      )}
      <MaterialCommunityIcons
        name={medals[place]}
        size={22}
        color={colors[place]}
        style={styles.medal}
      />
      <Text style={styles.name} numberOfLines={1}>
        {entry?.displayName || '—'}
      </Text>
      <Text style={styles.score}>{entry?.score ?? 0}</Text>
      <View style={[styles.podium, { height, backgroundColor: colors[place] }]} />
    </View>
  );
}

export default function PodiumLeaderboard({ entries }) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  return (
    <View style={styles.row}>
      <PodiumSlot entry={second} place={2} height={72} />
      <PodiumSlot entry={first} place={1} height={96} />
      <PodiumSlot entry={third} place={3} height={60} />
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
    backgroundColor: '#EDE8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: { marginBottom: 4 },
  name: { fontSize: 12, fontWeight: '700', color: H.text, maxWidth: '100%' },
  score: { fontSize: 14, fontWeight: '800', color: H.primary, marginVertical: 4 },
  podium: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 6,
    opacity: 0.85,
  },
});
