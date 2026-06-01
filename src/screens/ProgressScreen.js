import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import ScreenContainer from '../components/common/ScreenContainer';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const [loading] = useState(false);
  const quiz = userProfile?.quizProfile || {};

  const score = userProfile?.lastScore ?? quiz.bestScore ?? 0;
  const formatLastPlayed = (value) => {
    if (!value) return '—';
    try {
      if (value?.toDate) return value.toDate().toLocaleDateString();
      if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
      return new Date(value).toLocaleDateString();
    } catch {
      return '—';
    }
  };
  const lastPlayed = formatLastPlayed(userProfile?.lastPlayed);

  return (
    <ScreenContainer>
      <View style={[styles.wrap, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 120 }]}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your quiz scores and activity</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={[styles.heroCard, Shadows.card]}>
              <LinearGradient
                colors={['rgba(255,107,0,0.2)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="trophy" size={40} color={Colors.primary} />
              <Text style={styles.heroScore}>{score}</Text>
              <Text style={styles.heroLabel}>Last Quiz Score</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.miniCard}>
                <Ionicons name="calendar-outline" size={24} color={Colors.primaryLight} />
                <Text style={styles.miniLabel}>Last Played</Text>
                <Text style={styles.miniValue}>{lastPlayed}</Text>
              </View>
              <View style={styles.miniCard}>
                <Ionicons name="flame-outline" size={24} color={Colors.primaryLight} />
                <Text style={styles.miniLabel}>Streak</Text>
                <Text style={styles.miniValue}>{quiz.currentStreak ?? 0}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate('Quiz', { screen: 'QuizStats' })}
              activeOpacity={0.85}
            >
              <Ionicons name="stats-chart" size={22} color={Colors.primary} />
              <Text style={styles.linkText}>View full quiz statistics</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={22} color={Colors.primary} />
              <Text style={styles.tipText}>
                Open the Quiz tab to answer questions and improve your score. Progress syncs with your account.
              </Text>
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: Spacing.xxxl },
  title: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  loader: { marginTop: Spacing.huge },
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  heroScore: {
    fontSize: 56,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  heroLabel: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniLabel: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniValue: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  tipCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.accentSoft,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightSM,
  },
});
