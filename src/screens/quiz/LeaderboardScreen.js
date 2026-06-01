import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';
import { LEADERBOARD_PERIODS } from '../../constants/quiz';
import useLeaderboard from '../../hooks/useLeaderboard';
import PodiumLeaderboard from '../../components/quiz/PodiumLeaderboard';
import LeaderboardRow from '../../components/quiz/LeaderboardRow';
import BackHeader from '../../components/common/BackHeader';

const H = HomeTheme;
const PERIODS = Object.values(LEADERBOARD_PERIODS);

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [period, setPeriod] = useState('daily');
  const { entries, loading, error, refresh } = useLeaderboard(period);

  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="Leaderboard" transparent />

      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.tab, period === p.id && styles.tabOn]}
            onPress={() => setPeriod(p.id)}
          >
            <Text style={[styles.tabText, period === p.id && styles.tabTextOn]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={H.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.empty}>No scores yet. Be the first to play!</Text>
      ) : (
        <View style={styles.listWrap}>
          <PodiumLeaderboard entries={top3} />
          <FlashList
            data={rest}
            estimatedItemSize={64}
            keyExtractor={(item) => item.id || item.uid}
            renderItem={({ item }) => <LeaderboardRow entry={item} />}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
            onRefresh={refresh}
            refreshing={loading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: H.bg },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: H.surface,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: H.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: H.textMuted },
  tabTextOn: { color: '#FFF' },
  error: { textAlign: 'center', color: H.textMuted, marginTop: 24 },
  empty: { textAlign: 'center', color: H.textMuted, marginTop: 40, paddingHorizontal: 24 },
  listWrap: { flex: 1 },
});
