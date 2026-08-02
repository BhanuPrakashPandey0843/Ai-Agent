import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { QUIZ_TYPE_LIST } from '../../constants/quiz';
import { prepareQuizSession, flushPendingQuizSubmission } from '../../services/quizService';
import { getActiveSession } from '../../storage/quizStorage';
import useQuizCatalog from '../../hooks/useQuizCatalog';
import useQuizProfile from '../../hooks/useQuizProfile';
import QuizTypeCard from '../../components/quiz/QuizTypeCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { xpProgressInLevel } from '../../utils/quizScoring';
import GradientButton from '../../components/common/GradientButton';

export default function QuizHomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, patchUserProfile } = useAuth();
  const { showToast } = useToast();
  const { loading, error, questionCount, attemptedCount, refresh } = useQuizCatalog();
  const { profile } = useQuizProfile();
  const [starting, setStarting] = React.useState(false);

  const xp = xpProgressInLevel(profile?.xp || 0);

  const [savedSession, setSavedSession] = React.useState(null);

  // useFocusEffect (not a plain mount-only useEffect) so this re-checks
  // every time Quiz Home regains focus — after quitting a quiz via the
  // hardware back button (which skips QuizSessionScreen's own cleanup),
  // after finishing a quiz, or after switching tabs and back. A mount-only
  // effect would leave this screen's "Resume quiz" card stale (showing a
  // session that no longer exists, or missing one that was just left
  // in-progress) for as long as this screen instance stays mounted in the
  // stack, which for a tab-root screen can be the whole app session.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getActiveSession(user?.uid).then((s) => {
        if (!mounted) return;
        if (s?.status === 'active' && s.questions?.length) setSavedSession(s);
        else setSavedSession(null);
      });

      // Opportunistically finish any quiz result that failed to save last
      // time (dropped connection, app killed on the Result screen, etc.).
      // submitQuizSession's own duplicate guard makes this a safe no-op if
      // it turns out the result actually did save.
      if (user?.uid) {
        flushPendingQuizSubmission(user.uid).then((res) => {
          if (mounted && res?.profile) {
            patchUserProfile?.({ quizProfile: res.profile, lastScore: res.score });
            showToast('Saved a quiz result that didn\u2019t finish uploading earlier', 'success');
          }
        });
      }

      return () => {
        mounted = false;
      };
    }, [user?.uid, patchUserProfile, showToast])
  );

  const startQuiz = async (quizTypeId) => {
    if (!user?.uid) {
      showToast('Sign in to track progress and leaderboards', 'info');
    }
    setStarting(true);
    try {
      const result = await prepareQuizSession(user?.uid, quizTypeId);
      if (result.error === 'exhausted') {
        navigation.navigate('QuizSession', {
          exhausted: true,
          message: result.message,
        });
        return;
      }
      if (result.error === 'no_questions') {
        showToast(result.message, 'error');
        return;
      }
      navigation.navigate('QuizSession', { session: result.session });
    } catch (err) {
      showToast(err?.message || 'Could not start quiz', 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refresh(true)} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Quiz</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Test your Bible knowledge and grow your streak</Text>
        </View>

        {savedSession ? (
          <TouchableOpacity
            style={[styles.resumeCard, { backgroundColor: isDark ? colors.bgCardSoft : '#E8EFFF', borderColor: colors.primary }]}
            onPress={() => navigation.navigate('QuizSession', { session: savedSession })}
          >
            <MaterialCommunityIcons name="play-circle" size={28} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resumeTitle, { color: colors.textPrimary }]}>Resume quiz</Text>
              <Text style={[styles.resumeSub, { color: colors.textMuted }]}>
                Question {(savedSession.currentIndex || 0) + 1} of{' '}
                {savedSession.questions?.length || 0}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {profile ? (
          <View style={[styles.statsCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: colors.primary }]}>Lv {xp.level}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Level</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{profile.currentStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Streak</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{profile.bestScore || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Best</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.bgCard }]}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <MaterialCommunityIcons name="trophy" size={22} color={colors.primary} />
            <Text style={[styles.quickText, { color: colors.textPrimary }]}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.bgCard }]}
            onPress={() => navigation.navigate('QuizStats')}
          >
            <MaterialCommunityIcons name="chart-line" size={22} color={colors.primary} />
            <Text style={[styles.quickText, { color: colors.textPrimary }]}>My Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.bgCard }]}
            onPress={() => navigation.navigate('Achievements')}
          >
            <MaterialCommunityIcons name="medal" size={22} color={colors.primary} />
            <Text style={[styles.quickText, { color: colors.textPrimary }]}>Badges</Text>
          </TouchableOpacity>
        </View>

        {!loading && questionCount > 0 ? (
          <Text style={[styles.catalogMeta, { color: colors.textMuted }]}>
            {questionCount} questions · {attemptedCount} attempted
          </Text>
        ) : null}

        {!loading && !error && questionCount === 0 ? (
          <View style={[styles.errorBox, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>
              No quiz questions found. Upload from the admin panel, then pull down to refresh.
            </Text>
            <GradientButton title="Refresh Questions" onPress={() => refresh(true)} style={{ marginTop: 12 }} />
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
            <GradientButton title="Retry" onPress={refresh} style={{ marginTop: 12 }} />
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          QUIZ_TYPE_LIST.map((type) => (
            <QuizTypeCard
              key={type.id}
              quizType={type}
              onPress={() => startQuiz(type.id)}
            />
          ))
        )}

        {starting ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#FFF" size="large" />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { marginTop: 8, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  quickText: { fontSize: 12, fontWeight: '700' },
  catalogMeta: { fontSize: 12, marginBottom: 12 },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  resumeTitle: { fontSize: 15, fontWeight: '800' },
  resumeSub: { fontSize: 12, marginTop: 2 },
  errorBox: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorText: { textAlign: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
