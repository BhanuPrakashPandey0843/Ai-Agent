import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../../theme/colors';
import { submitQuizSessionDurable } from '../../services/quizService';
import { computeSessionScore, computeAccuracy } from '../../utils/quizScoring';
import { useAuth } from '../../context/AuthContext';
import GradientButton from '../../components/common/GradientButton';
import { useToast } from '../../context/ToastContext';

export default function QuizResultScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user, userProfile, patchUserProfile } = useAuth();
  const { showToast } = useToast();

  const { session, quizTypeId } = route.params || {};
  const answers = session?.answers || [];
  const questions = session?.questions || [];
  const startedAt = session?.startedAt || Date.now();
  const completionTimeMs = Date.now() - startedAt;

  const correctCount = answers.filter((a) => a.correct).length;
  const localScore = computeSessionScore(answers);
  const localAccuracy = computeAccuracy(correctCount, answers.length);

  const [submitting, setSubmitting] = useState(!!user?.uid);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [result, setResult] = useState(null);

  const attemptSubmit = useCallback(async () => {
    if (!user?.uid) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      const payload = {
        sessionId: session.sessionId,
        quizTypeId: quizTypeId || session.quizTypeId,
        answers,
        completionTimeMs,
        questions,
      };
      // submitQuizSessionDurable persists this payload to disk first, so a
      // dropped connection or a killed app doesn't lose the result — it's
      // retried automatically next time Quiz Home mounts, or immediately via
      // the Retry button below.
      const res = await submitQuizSessionDurable(user.uid, payload, {
        name: userProfile?.name || user.displayName,
        photoURL: userProfile?.photoURL || user.photoURL,
      });
      setResult(res);
      if (res.newlyUnlocked?.length) {
        showToast(`Unlocked: ${res.newlyUnlocked[0].title}`, 'success');
      }
      // Local merge only - no Firestore round trip. submitQuizSession's
      // transaction already wrote this exact quizProfile to Firestore;
      // re-fetching the same document here would be a duplicate read
      // that also delays the Result screen for nothing.
      // Guarded on res.profile: the duplicate-submission path returns a
      // different shape ({ duplicate: true, result }) with no top-level
      // `profile`, and patching with undefined would wipe the user's
      // real local profile instead of leaving it untouched.
      if (res.profile) {
        patchUserProfile?.({ quizProfile: res.profile, lastScore: res.score, lastPlayed: new Date().toISOString() });
      }
    } catch (err) {
      setSubmitFailed(true);
      showToast(err?.message || 'Could not save results — you can retry below', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [user?.uid, session, quizTypeId, answers, completionTimeMs, questions, userProfile, patchUserProfile, showToast]);

  useEffect(() => {
    attemptSubmit();
    // Intentionally run once per screen instance (mirrors the original
    // mount-only submit); retries are user- or Quiz-Home-triggered, not
    // re-triggered by this effect re-running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const score = result?.score ?? localScore;
  const accuracy = result?.accuracy ?? localAccuracy;

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + 100, backgroundColor: colors.bg }]}>
      {submitting ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: Spacing.xxl }} />
      ) : (
        <MaterialCommunityIcons
          name={accuracy >= 80 ? 'trophy' : 'star-circle'}
          size={56}
          color={colors.primary}
        />
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Quiz Complete</Text>
      <Text style={[styles.score, { color: colors.primary }]}>{score} pts</Text>
      <View style={styles.row}>
        <View style={[styles.stat, { backgroundColor: colors.bgCard }, Shadows.card(isDark)]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>{accuracy}%</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Accuracy</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.bgCard }, Shadows.card(isDark)]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>
            {correctCount}/{answers.length}
          </Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Correct</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.bgCard }, Shadows.card(isDark)]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>{Math.round(completionTimeMs / 1000)}s</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Time</Text>
        </View>
      </View>

      {!user?.uid ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Sign in to save progress and appear on leaderboards.</Text>
      ) : null}

      {submitFailed ? (
        <TouchableOpacity
          style={[styles.retryBox, { backgroundColor: isDark ? '#3B1B1B' : '#FFEBEE', borderColor: colors.error }]}
          onPress={attemptSubmit}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="cloud-alert" size={20} color={colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.retryTitle, { color: colors.textPrimary }]}>Couldn't save this result</Text>
            <Text style={[styles.retrySub, { color: colors.textMuted }]}>
              Your score is safe on this device. Tap to retry saving it.
            </Text>
          </View>
          <MaterialCommunityIcons name="refresh" size={20} color={colors.error} />
        </TouchableOpacity>
      ) : null}

      <GradientButton
        title="Leaderboard"
        onPress={() => navigation.navigate('Leaderboard')}
        disabled={submitting}
        style={styles.btn}
      />
      <GradientButton
        title="Back to Quiz Home"
        onPress={() => navigation.navigate('QuizHome')}
        colors={isDark ? ['#1A1A33', '#1A1A33'] : ['#EDE8DC', '#EDE8DC']}
        textStyle={{ color: colors.textPrimary }}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    marginTop: Spacing.lg,
  },
  score: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    marginVertical: Spacing.md,
  },
  row: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.xl, width: '100%' },
  stat: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statVal: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightExtraBold },
  statLbl: { fontSize: Typography.fontSizeXS, marginTop: Spacing.xs },
  hint: {
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeightSM,
  },
  retryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  retryTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold },
  retrySub: { fontSize: Typography.fontSizeXS, marginTop: 2, lineHeight: Typography.lineHeightSM },
  btn: { width: '100%', marginTop: Spacing.sm },
});
