import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { submitQuizSession } from '../../services/quizService';
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
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user?.uid) {
        setSubmitting(false);
        return;
      }
      try {
        const payload = {
          sessionId: session.sessionId,
          quizTypeId: quizTypeId || session.quizTypeId,
          answers,
          completionTimeMs,
          questions,
        };
        const res = await submitQuizSession(user.uid, payload, {
          name: userProfile?.name || user.displayName,
          photoURL: userProfile?.photoURL || user.photoURL,
        });
        if (mounted) {
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
        }
      } catch (err) {
        if (mounted) {
          showToast(err?.message || 'Could not save results', 'error');
        }
      } finally {
        if (mounted) setSubmitting(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const score = result?.score ?? localScore;
  const accuracy = result?.accuracy ?? localAccuracy;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100, backgroundColor: colors.bg }]}>
      {submitting ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 24 }} />
      ) : (
        <MaterialCommunityIcons
          name={accuracy >= 80 ? 'trophy' : 'star-circle'}
          size={72}
          color={colors.primary}
        />
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Quiz Complete</Text>
      <Text style={[styles.score, { color: colors.primary }]}>{score} pts</Text>
      <View style={styles.row}>
        <View style={[styles.stat, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>{accuracy}%</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Accuracy</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>
            {correctCount}/{answers.length}
          </Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Correct</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.bgCard }]}>
          <Text style={[styles.statVal, { color: colors.textPrimary }]}>{Math.round(completionTimeMs / 1000)}s</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>Time</Text>
        </View>
      </View>

      {!user?.uid ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Sign in to save progress and appear on leaderboards.</Text>
      ) : null}

      <GradientButton
        title="Leaderboard"
        onPress={() => navigation.navigate('Leaderboard')}
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
    paddingHorizontal: 24,
  },
  title: { fontSize: 26, fontWeight: '800', marginTop: 16 },
  score: { fontSize: 42, fontWeight: '800', marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12, marginVertical: 20, width: '100%' },
  stat: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { fontSize: 12, marginTop: 4 },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  btn: { width: '100%', marginTop: 8 },
});
