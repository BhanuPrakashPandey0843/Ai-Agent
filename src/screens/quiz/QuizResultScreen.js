import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';
import { submitQuizSession } from '../../services/quizService';
import { computeSessionScore, computeAccuracy } from '../../utils/quizScoring';
import { useAuth } from '../../context/AuthContext';
import GradientButton from '../../components/common/GradientButton';
import { useToast } from '../../context/ToastContext';

const H = HomeTheme;

export default function QuizResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user, userProfile, refreshProfile } = useAuth();
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
          await refreshProfile?.();
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
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 }]}>
      {submitting ? (
        <ActivityIndicator size="large" color={H.primary} style={{ marginBottom: 24 }} />
      ) : (
        <MaterialCommunityIcons
          name={accuracy >= 80 ? 'trophy' : 'star-circle'}
          size={72}
          color={H.primary}
        />
      )}
      <Text style={styles.title}>Quiz Complete</Text>
      <Text style={styles.score}>{score} pts</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{accuracy}%</Text>
          <Text style={styles.statLbl}>Accuracy</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>
            {correctCount}/{answers.length}
          </Text>
          <Text style={styles.statLbl}>Correct</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{Math.round(completionTimeMs / 1000)}s</Text>
          <Text style={styles.statLbl}>Time</Text>
        </View>
      </View>

      {!user?.uid ? (
        <Text style={styles.hint}>Sign in to save progress and appear on leaderboards.</Text>
      ) : null}

      <GradientButton
        title="Leaderboard"
        onPress={() => navigation.navigate('Leaderboard')}
        style={styles.btn}
      />
      <GradientButton
        title="Back to Quiz Home"
        onPress={() => navigation.navigate('QuizHome')}
        colors={['#EDE8DC', '#EDE8DC']}
        textStyle={{ color: H.text }}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: H.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: { fontSize: 26, fontWeight: '800', color: H.text, marginTop: 16 },
  score: { fontSize: 42, fontWeight: '800', color: H.primary, marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12, marginVertical: 20, width: '100%' },
  stat: {
    flex: 1,
    backgroundColor: H.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    ...H.shadow,
  },
  statVal: { fontSize: 18, fontWeight: '800', color: H.text },
  statLbl: { fontSize: 12, color: H.textMuted, marginTop: 4 },
  hint: {
    fontSize: 13,
    color: H.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  btn: { width: '100%', marginTop: 8 },
});
