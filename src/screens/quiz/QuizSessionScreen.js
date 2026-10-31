import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
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
import QuizProgressBar from '../../components/quiz/QuizProgressBar';
import QuizOptionButton from '../../components/quiz/QuizOptionButton';
import GradientButton from '../../components/common/GradientButton';
import EmptyState from '../../components/common/EmptyState';
import { saveActiveSession, clearActiveSession } from '../../storage/quizStorage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { submitQuizAnswer } from '../../services/quizService';

export default function QuizSessionScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { showToast } = useToast();

  const exhausted = route.params?.exhausted;
  const exhaustedMessage = route.params?.message;

  const [session, setSession] = useState(route.params?.session || null);
  // Clamp the restored index into a valid question slot. Combined with the
  // "advance past the answered question" persistence fix in handleSelect
  // below, a resumed session's stored currentIndex always already points at
  // the next UNANSWERED question - so this never re-lands on a question
  // that already has an answer recorded for it (see handleSelect).
  const initialQuestions = session?.questions || [];
  const [index, setIndex] = useState(() => {
    const answeredIds = new Set((session?.answers || []).map((answer) => answer.questionId));
    let nextIndex = Math.min(session?.currentIndex || 0, initialQuestions.length);
    while (nextIndex < initialQuestions.length && answeredIds.has(initialQuestions[nextIndex]?.id)) {
      nextIndex += 1;
    }
    return nextIndex;
  });
  const [selected, setSelected] = useState(null);
  const [answerCorrectIndex, setAnswerCorrectIndex] = useState(null);
  const [answering, setAnswering] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [timeoutFailed, setTimeoutFailed] = useState(false);
  const [answers, setAnswers] = useState(session?.answers || []);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const answeredIdsRef = useRef(new Set((session?.answers || []).map((answer) => answer.questionId)));
  const deadlineRef = useRef(Number(session?.questionDeadlineAt) || null);
  const finishLockRef = useRef(false);
  const advanceLockRef = useRef(false);
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

  const finishQuiz = useCallback(
    async (finalAnswers) => {
      if (finishLockRef.current) return;
      finishLockRef.current = true;
      clearInterval(timerRef.current);
      try {
        await clearActiveSession(user?.uid);
        navigation.replace('QuizResult', {
          session: { ...session, answers: finalAnswers },
          quizTypeId: session.quizTypeId,
        });
      } catch (err) {
        finishLockRef.current = false;
        showToast(err?.message || 'Could not finish the quiz. Please try again.', 'error');
      }
    },
    [session, user?.uid, navigation, showToast]
  );

  // Guards the resume edge case where the app was closed/killed AFTER the
  // last question was answered but BEFORE "See Results" was tapped: every
  // question already has a recorded answer, so there's nothing left to show
  // - jump straight to the Result screen instead of re-rendering a question
  // (which, pre-fix, could re-show the already-answered last question and
  // let it be answered a second time).
  useEffect(() => {
    if (!exhausted && session && questions.length > 0 && answers.length >= questions.length) {
      finishQuiz(answers);
    }
    // Only needs to run once, right after mount/resume - subsequent answers
    // are handled by goNext's own completion branch, not this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(async (optionIndex) => {
    if (finishLockRef.current || revealed || !current || answeredIdsRef.current.has(current.id)) return;
    const timedOut = deadlineRef.current && Date.now() >= deadlineRef.current;
    const submittedIndex = optionIndex === -1 || timedOut ? -1 : optionIndex;
    answeredIdsRef.current.add(current.id);
    const deadline = deadlineRef.current;
    const timeMs = deadline
      ? Math.min(SECONDS_PER_QUESTION * 1000, Math.max(0, SECONDS_PER_QUESTION * 1000 - (deadline - Date.now())))
      : SECONDS_PER_QUESTION * 1000;
    setSelected(submittedIndex);
    setAnswering(true);

    let answerResult;
    try {
      answerResult = await submitQuizAnswer(session.sessionId, current.id, submittedIndex);
    } catch (err) {
      answeredIdsRef.current.delete(current.id);
      setSelected(null);
      setAnswering(false);
      if (submittedIndex === -1) setTimeoutFailed(true);
      showToast(err?.message || 'Could not record your answer. Please try again.', 'error');
      return;
    }

    clearInterval(timerRef.current);
    setTimeoutFailed(false);
    const correct = answerResult.correct === true;
    const answer = {
      questionId: current.id,
      selectedIndex: answerResult.selectedIndex,
      correct,
      timeMs,
      pointsEarned: Number(answerResult.pointsEarned) || 0,
    };
    setSelected(answerResult.selectedIndex);
    setAnswerCorrectIndex(answerResult.correctIndex);
    setAnswering(false);
    setRevealed(true);
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch((err) => console.warn('[Quiz] Haptic feedback failed:', err?.message));

    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);

    // Persist currentIndex ADVANCED PAST this question (clamped to the last
    // valid index), not the index just answered. This is the fix for the
    // critical "duplicate answer on resume" bug: previously this saved
    // currentIndex: index (the question just answered), so quitting/losing
    // the app in the window between answering and tapping "Next" would, on
    // resume, re-show that exact same question unrevealed - answering it
    // again appended a SECOND answer entry for the same questionId, which
    // silently inflated correctCount/score/XP on submit. Advancing the
    // persisted checkpoint here means a resumed session always lands on the
    // next genuinely-unanswered question instead.
    const nextSession = {
      ...session,
      currentIndex: Math.min(index + 1, questions.length - 1),
      answers: nextAnswers,
      questionDeadlineAt: null,
    };
    try {
      await persistSession(nextSession);
    } catch (err) {
      showToast(err?.message || 'Could not save quiz progress on this device.', 'error');
    }
  }, [revealed, current, session, index, questions.length, answers, persistSession, showToast]);

  useEffect(() => {
    if (exhausted || !current || revealed || finishLockRef.current) return undefined;

    if (!Number.isFinite(deadlineRef.current) || deadlineRef.current <= 0) {
      deadlineRef.current = Date.now() + SECONDS_PER_QUESTION * 1000;
      persistSession({ ...session, questionDeadlineAt: deadlineRef.current }).catch((err) => {
        showToast(err?.message || 'Could not save timer progress on this device.', 'error');
      });
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) clearInterval(timerRef.current);
    };

    updateRemaining();
    timerRef.current = setInterval(updateRemaining, 200);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateRemaining();
    });
    return () => {
      clearInterval(timerRef.current);
      subscription.remove();
    };
  }, [index, current?.id, exhausted, revealed, session, persistSession, showToast]);

  useEffect(() => {
    if (secondsLeft === 0 && current && !revealed && !finishLockRef.current) {
      handleSelect(-1);
    }
  }, [secondsLeft, current, revealed, handleSelect]);

  const goNext = async () => {
    if (advanceLockRef.current || finishLockRef.current) return;
    advanceLockRef.current = true;
    if (index >= questions.length - 1) {
      await finishQuiz(answers);
      advanceLockRef.current = false;
      return;
    }
    const nextIndex = index + 1;
    deadlineRef.current = Date.now() + SECONDS_PER_QUESTION * 1000;
    try {
      await persistSession({
      ...session,
      currentIndex: nextIndex,
      answers,
      questionDeadlineAt: deadlineRef.current,
      });
      setIndex(nextIndex);
      setSelected(null);
      setAnswerCorrectIndex(null);
      setRevealed(false);
      setTimeoutFailed(false);
    } catch (err) {
      showToast(err?.message || 'Could not save quiz progress on this device.', 'error');
    } finally {
      advanceLockRef.current = false;
    }
  };

  const quit = async () => {
    try {
      await clearActiveSession(user?.uid);
      navigation.goBack();
    } catch (err) {
      showToast(err?.message || 'Could not close the quiz. Please try again.', 'error');
    }
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

  if (session && !current && answers.length >= questions.length) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Quiz complete</Text>
        <GradientButton title="See Results" onPress={() => finishQuiz(answers)} style={{ marginTop: Spacing.lg }} />
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
                if (i === answerCorrectIndex) state = 'correct';
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
                  disabled={revealed || answering || secondsLeft === 0}
                  onPress={() => handleSelect(i)}
                />
              );
            })}

          {timeoutFailed ? (
            <>
              <Text style={[styles.explanation, { color: colors.error }]}>
                Time expired, but your unanswered response could not be submitted.
              </Text>
              <GradientButton
                title="Retry submission"
                onPress={() => handleSelect(-1)}
                loading={answering}
                style={{ marginTop: Spacing.sm }}
              />
            </>
          ) : null}

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
