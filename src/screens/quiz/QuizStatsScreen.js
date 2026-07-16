import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import BackHeader from '../../components/common/BackHeader';
import useQuizProfile from '../../hooks/useQuizProfile';
import { xpProgressInLevel, computeAccuracy } from '../../utils/quizScoring';

function StatCard({ icon, label, value, colors }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function QuizStatsScreen() {
  const { colors, isDark } = useTheme();
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
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <BackHeader title="Quiz Statistics" transparent />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.levelCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>Level {xp.level}</Text>
            <View style={[styles.xpBar, { backgroundColor: isDark ? '#1A1A33' : '#EDE8DC' }]}>
              <View style={[styles.xpFill, { width: `${(xp.current / xp.needed) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.xpText, { color: colors.textMuted }]}>
              {xp.current} / {xp.needed} XP
            </Text>
          </View>

          <View style={styles.grid}>
            <StatCard icon="clipboard-list" label="Total Quizzes" value={profile?.totalQuizzes || 0} colors={colors} />
            <StatCard icon="help-circle" label="Questions" value={profile?.totalQuestions || 0} colors={colors} />
            <StatCard icon="bullseye-arrow" label="Accuracy" value={`${accuracy}%`} colors={colors} />
            <StatCard icon="timer" label="Best Time" value={avgTime} colors={colors} />
            <StatCard icon="fire" label="Current Streak" value={profile?.currentStreak || 0} colors={colors} />
            <StatCard icon="fire-circle" label="Longest Streak" value={profile?.longestStreak || 0} colors={colors} />
            <StatCard icon="star" label="Best Score" value={profile?.bestScore || 0} colors={colors} />
            <StatCard icon="trophy" label="Best Accuracy" value={`${profile?.bestAccuracy || 0}%`} colors={colors} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Strengths</Text>
          {strengths.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>Play quizzes to see strengths by category.</Text>
          ) : (
            strengths.map((s) => (
              <View key={s.cat} style={styles.strengthRow}>
                <Text style={[styles.catName, { color: colors.textPrimary }]}>{s.cat}</Text>
                <View style={[styles.strengthBar, { backgroundColor: isDark ? '#1A1A33' : '#EDE8DC' }]}>
                  <View style={[styles.strengthFill, { width: `${s.rate}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.rate, { color: colors.primary }]}>{s.rate}%</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  levelCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  levelTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  xpBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: { height: '100%' },
  xpText: { fontSize: 12, marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  card: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardValue: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  cardLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  catName: { width: 56, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  strengthBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%' },
  rate: { width: 40, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  muted: { fontSize: 14 },
});
