import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';
import BackHeader from '../../components/common/BackHeader';
import useQuizProfile from '../../hooks/useQuizProfile';
import { xpProgressInLevel, computeAccuracy } from '../../utils/quizScoring';

const H = HomeTheme;

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.card}>
      <MaterialCommunityIcons name={icon} size={24} color={H.primary} />
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function QuizStatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, loading } = useQuizProfile();

  const xp = xpProgressInLevel(profile?.xp || 0);
  const accuracy =
    profile?.totalQuestions > 0
      ? computeAccuracy(profile.totalCorrect, profile.totalQuestions)
      : 0;
  const avgTime =
    profile?.totalQuizzes > 0 && profile?.fastestTimeMs != null
      ? `${Math.round(profile.fastestTimeMs / 1000)}s best`
      : '—';

  const categoryStats = profile?.categoryStats || {};
  const strengths = Object.entries(categoryStats)
    .map(([cat, s]) => ({
      cat,
      rate: s.total ? Math.round((s.correct / s.total) * 100) : 0,
      total: s.total,
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.rate - a.rate);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="Quiz Statistics" transparent />

      {loading ? (
        <ActivityIndicator size="large" color={H.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.levelCard}>
            <Text style={styles.levelTitle}>Level {xp.level}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${(xp.current / xp.needed) * 100}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {xp.current} / {xp.needed} XP
            </Text>
          </View>

          <View style={styles.grid}>
            <StatCard icon="clipboard-list" label="Total Quizzes" value={profile?.totalQuizzes || 0} />
            <StatCard icon="help-circle" label="Questions" value={profile?.totalQuestions || 0} />
            <StatCard icon="bullseye-arrow" label="Accuracy" value={`${accuracy}%`} />
            <StatCard icon="timer" label="Best Time" value={avgTime} />
            <StatCard icon="fire" label="Current Streak" value={profile?.currentStreak || 0} />
            <StatCard icon="fire-circle" label="Longest Streak" value={profile?.longestStreak || 0} />
            <StatCard icon="star" label="Best Score" value={profile?.bestScore || 0} />
            <StatCard icon="trophy" label="Best Accuracy" value={`${profile?.bestAccuracy || 0}%`} />
          </View>

          <Text style={styles.sectionTitle}>Category Strengths</Text>
          {strengths.length === 0 ? (
            <Text style={styles.muted}>Play quizzes to see strengths by category.</Text>
          ) : (
            strengths.map((s) => (
              <View key={s.cat} style={styles.strengthRow}>
                <Text style={styles.catName}>{s.cat}</Text>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${s.rate}%` }]} />
                </View>
                <Text style={styles.rate}>{s.rate}%</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: H.bg },
  levelCard: {
    backgroundColor: H.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    ...H.shadow,
  },
  levelTitle: { fontSize: 22, fontWeight: '800', color: H.text, marginBottom: 12 },
  xpBar: {
    height: 10,
    backgroundColor: '#EDE8DC',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: H.primary },
  xpText: { fontSize: 12, color: H.textMuted, marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  card: {
    width: '47%',
    backgroundColor: H.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    ...H.shadow,
  },
  cardValue: { fontSize: 20, fontWeight: '800', color: H.text, marginTop: 8 },
  cardLabel: { fontSize: 11, color: H.textMuted, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: H.text, marginBottom: 12 },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  catName: { width: 56, fontSize: 12, fontWeight: '700', color: H.text, textTransform: 'capitalize' },
  strengthBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#EDE8DC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', backgroundColor: H.primary },
  rate: { width: 40, fontSize: 12, fontWeight: '700', color: H.primary, textAlign: 'right' },
  muted: { color: H.textMuted, fontSize: 14 },
});
