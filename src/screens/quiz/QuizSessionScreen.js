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
import { QUIZ_TYPES, SECONDS_PER_QUESTION } from '../../constants/quiz';
import { pointsForQuestion } from '../../utils/quizScoring';
import QuizProgressBar from '../../components/quiz/QuizProgressBar';
import QuizOptionButton from '../../components/quiz/QuizOptionButton';
import GradientButton from '../../components/common/GradientButton';
import EmptyState from '../../components/common/EmptyState';
import { saveActiveSession, clearActiveSession } from '../../storage/quizStorage';
import { useAuth } from '../../context/AuthContext';

export default function QuizSessionScreen() {
  const { colors } = useTheme();
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
    <View style={[styles.root, { paddingTop: insets.top + 8, backgroundColor: colors.bg, paddingHorizontal: 20 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={quit} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.typeLabel, { color: colors.textPrimary }]}>{quizType?.label}</Text>
        <View style={styles.timer}>
          <Ionicons name="time-outline" size={16} color={secondsLeft <= 10 ? '#C62828' : colors.textMuted} />
          <Text style={[styles.timerText, { color: colors.textMuted }, secondsLeft <= 10 && styles.timerUrgent]}>
            {secondsLeft}s
          </Text>
        </View>
      </View>

      <QuizProgressBar progress={progress} />
      <Text style={[styles.counter, { color: colors.textMuted }]}>
        Question {index + 1} of {questions.length}
      </Text>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
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
            style={{ marginTop: 8 }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeLabel: { fontSize: 14, fontWeight: '700' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 14, fontWeight: '700' },
  timerUrgent: { color: '#C62828' },
  counter: { fontSize: 13, marginTop: 8, marginBottom: 16 },
  scroll: { paddingTop: 4 },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  reference: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  explanation: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  muted: {},
});
