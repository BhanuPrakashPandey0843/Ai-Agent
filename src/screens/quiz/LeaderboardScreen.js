import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LEADERBOARD_PERIODS } from '../../constants/quiz';
import useLeaderboard from '../../hooks/useLeaderboard';
import PodiumLeaderboard from '../../components/quiz/PodiumLeaderboard';
import LeaderboardRow from '../../components/quiz/LeaderboardRow';
import BackHeader from '../../components/common/BackHeader';
import EmptyState from '../../components/common/EmptyState';

const PERIODS = Object.values(LEADERBOARD_PERIODS);

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [period, setPeriod] = useState('daily');
  const { entries, loading, error, refresh } = useLeaderboard(period);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // useLeaderboard already fetches on mount and whenever `period` changes.
  // Keep this callback stable so changing periods does not trigger a second
  // fetch; use the ref to call the latest period-specific refresh on focus.
  const skippedFirstFocus = useRef(false);

  // Standings can change any time another player finishes a quiz, so a
  // one-time fetch on mount goes stale the moment the user leaves and comes
  // back (e.g. checked Achievements, then tapped back into Leaderboard —
  // this screen instance never unmounted, so its data would otherwise sit
  // frozen at whatever it was on the first visit). Re-fetching on focus is
  // the "automatic refresh" a leaderboard needs without the cost of a
  // permanent Firestore realtime listener per period.
  useFocusEffect(
    useCallback(() => {
      if (!skippedFirstFocus.current) {
        skippedFirstFocus.current = true;
        return;
      }
      refreshRef.current();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <BackHeader title="Leaderboard" transparent />

      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.tab, { backgroundColor: colors.bgCard }, period === p.id && { backgroundColor: colors.primary }]}
            onPress={() => setPeriod(p.id)}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, period === p.id && styles.tabTextOn]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load leaderboard"
          message={error}
          actionLabel="Retry"
          onAction={refresh}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="No scores yet"
          message="Be the first to play and claim the top spot!"
        />
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
  root: { flex: 1 },
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
    alignItems: 'center',
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabTextOn: { color: '#FFF' },
  listWrap: { flex: 1 },
});
