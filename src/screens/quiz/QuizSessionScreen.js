import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../../theme/colors';
import { QUIZ_TYPES, SECONDS_PER_QUESTION, TIMER_URGENT_THRESHOLD_SECONDS } from '../../constants/quiz';
import { pointsForQuestion } from '../../utils/quizScoring';
import QuizProgressBar from '../../components/quiz/QuizProgressBar';
import QuizOptionButton from '../../components/quiz/QuizOptionButton';
import GradientButton from '../../components/common/GradientButton';
import EmptyState from '../../components/common/EmptyState';
import { saveActiveSession, clearActiveSession } from '../../storage/quizStorage';
import { useAuth } from '../../context/AuthContext';

export default function QuizSessionScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const exhausted = route.params?.exhausted;
  const exhaustedMessage = route.params?.message;

  const [session, setSession] = useState(route.params?.session || null);
  const [index, setIndex] = useState(session?.currentIndex || 0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState(session?.answers || []);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const questionStarted = useRef(Date.now());
  const timerRef = useRef(null);

  const questions = session?.questions || [];
  const current = questions[index];
  const quizType = session ? QUIZ_TYPES[session.quizTypeId] : null;
  const progress = questions.length ? (index + (revealed ? 1 : 0)) / questions.length : 0;
  const isUrgent = secondsLeft <= TIMER_URGENT_THRESHOLD_SECONDS;

  const persistSession = useCallback(
    async (next) => {
      setSession(next);
      await saveActiveSession(user?.uid, next);
    },
    [user?.uid]
  );

  useEffect(() => {
    if (exhausted || !current || revealed) return undefined;
    setSecondsLeft(SECONDS_PER_QUESTION);
    questionStarted.current = Date.now();
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [index, exhausted, current, revealed]);

  const revealedRef = useRef(false);
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    if (secondsLeft === 0 && !revealedRef.current && current) {
      handleSelect(-1);
    }
  }, [secondsLeft, current]);

  const handleSelect = async (optionIndex) => {
    if (revealed || !current) return;
    clearInterval(timerRef.current);
    const timeMs = Date.now() - questionStarted.current;
    const correct = optionIndex === current.correctIndex;
    setSelected(optionIndex);
    setRevealed(true);

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    const answer = {
      questionId: current.id,
      selectedIndex: optionIndex,
      correct,
      timeMs,
      pointsEarned: correct ? pointsForQuestion(current.difficulty) : 0,
    };

    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);

    const nextSession = {
      ...session,
      currentIndex: index,
      answers: nextAnswers,
    };
    await persistSession(nextSession);
  };

  const goNext = async () => {
    if (index >= questions.length - 1) {
      await clearActiveSession(user?.uid);
      navigation.replace('QuizResult', {
        session: { ...session, answers },
        quizTypeId: session.quizTypeId,
      });
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setSelected(null);
    setRevealed(false);
    await persistSession({
      ...session,
      currentIndex: nextIndex,
      answers,
    });
  };

  const quit = async () => {
    await clearActiveSession(user?.uid);
    navigation.goBack();
  };

  if (exhausted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="All caught up!"
          message={
            exhaustedMessage || 'You have completed all available questions.'
          }
          actionLabel="Back to Quiz Home"
          onAction={() => navigation.navigate('QuizHome')}
        />
      </View>
    );
  }

  if (!session || !current) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Loading session...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.bg }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={quit}
          hitSlop={10}
          style={[styles.closeBtn, { backgroundColor: colors.bgCard }]}
        >
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.typeLabel, { color: colors.textPrimary }]} numberOfLines={1}>
          {quizType?.label}
        </Text>

        <View
          style={[
            styles.timerPill,
            { backgroundColor: isUrgent ? (isDark ? '#3B1B1B' : '#FFEBEE') : colors.bgCard },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={isUrgent ? colors.error : colors.textMuted}
          />
          <Text
            style={[
              styles.timerText,
              { color: isUrgent ? colors.error : colors.textMuted },
            ]}
          >
            {secondsLeft}s
          </Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <QuizProgressBar progress={progress} />
        <Text style={[styles.counter, { color: colors.textMuted }]}>
          Question {index + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.bgCard }, Shadows.card(isDark)]}>
          <Text style={[styles.question, { color: colors.textPrimary }]}>{current.question}</Text>
          {current.reference ? (
            <Text style={[styles.reference, { color: colors.primary }]}>{current.reference}</Text>
          ) : null}

          {current.options
            .map((opt, i) => ({ opt: String(opt || '').trim(), i }))
            .filter(({ opt }) => opt.length > 0)
            .map(({ opt, i }, displayIndex) => {
              let state = 'default';
              if (revealed) {
                if (i === current.correctIndex) state = 'correct';
                else if (selected === i) state = 'wrong';
              } else if (selected === i) {
                state = 'selected';
              }
              return (
                <QuizOptionButton
                  key={`${current.id}-${i}`}
                  label={opt}
                  letter={String.fromCharCode(65 + displayIndex)}
                  state={state}
                  disabled={revealed}
                  onPress={() => handleSelect(i)}
                />
              );
            })}

          {revealed && current.explanation ? (
            <Text style={[styles.explanation, { color: colors.textMuted }]}>{current.explanation}</Text>
          ) : null}
        </View>

        {revealed ? (
          <GradientButton
            title={index >= questions.length - 1 ? 'See Results' : 'Next Question'}
            onPress={goNext}
            style={{ marginTop: Spacing.sm }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Spacing.xl },
  centered: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    marginHorizontal: Spacing.sm,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  timerText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold },
  progressWrap: { marginTop: Spacing.lg },
  counter: {
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  scroll: { paddingTop: Spacing.xs },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  question: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    lineHeight: Typography.lineHeightLG,
    marginBottom: Spacing.sm,
  },
  reference: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    marginBottom: Spacing.lg,
  },
  explanation: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSizeSM,
    lineHeight: Typography.lineHeightMD,
    fontStyle: 'italic',
  },
  muted: {},
});
