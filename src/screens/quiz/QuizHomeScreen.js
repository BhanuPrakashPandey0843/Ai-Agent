import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';
import { QUIZ_TYPE_LIST } from '../../constants/quiz';
import { prepareQuizSession } from '../../services/quizService';
import { getActiveSession } from '../../storage/quizStorage';
import useQuizCatalog from '../../hooks/useQuizCatalog';
import useQuizProfile from '../../hooks/useQuizProfile';
import QuizTypeCard from '../../components/quiz/QuizTypeCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { xpProgressInLevel } from '../../utils/quizScoring';
import GradientButton from '../../components/common/GradientButton';

const H = HomeTheme;

export default function QuizHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { loading, error, questionCount, attemptedCount, refresh } = useQuizCatalog();
  const { profile } = useQuizProfile();
  const [starting, setStarting] = React.useState(false);

  const xp = xpProgressInLevel(profile?.xp || 0);

  const [savedSession, setSavedSession] = React.useState(null);

  React.useEffect(() => {
    getActiveSession(user?.uid).then((s) => {
      if (s?.status === 'active' && s.questions?.length) setSavedSession(s);
      else setSavedSession(null);
    });
  }, [user?.uid]);

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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={H.primary} />
        }
      >
        <Text style={styles.title}>Faith Quiz</Text>
        <Text style={styles.subtitle}>Christ-centered challenges from your question bank</Text>

        {savedSession ? (
          <TouchableOpacity
            style={styles.resumeCard}
            onPress={() => navigation.navigate('QuizSession', { session: savedSession })}
          >
            <MaterialCommunityIcons name="play-circle" size={28} color={H.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeTitle}>Resume quiz</Text>
              <Text style={styles.resumeSub}>
                Question {(savedSession.currentIndex || 0) + 1} of{' '}
                {savedSession.questions?.length || 0}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {profile ? (
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>Lv {xp.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{profile.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{profile.bestScore || 0}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <MaterialCommunityIcons name="trophy" size={22} color={H.primary} />
            <Text style={styles.quickText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('QuizStats')}
          >
            <MaterialCommunityIcons name="chart-line" size={22} color={H.primary} />
            <Text style={styles.quickText}>My Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('Achievements')}
          >
            <MaterialCommunityIcons name="medal" size={22} color={H.primary} />
            <Text style={styles.quickText}>Badges</Text>
          </TouchableOpacity>
        </View>

        {!loading && questionCount > 0 ? (
          <Text style={styles.catalogMeta}>
            {questionCount} questions · {attemptedCount} attempted
          </Text>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <GradientButton title="Retry" onPress={refresh} style={{ marginTop: 12 }} />
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={H.primary} style={{ marginTop: 40 }} />
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
  root: { flex: 1, backgroundColor: H.bg },
  title: { fontSize: 28, fontWeight: '800', color: H.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: H.textMuted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: H.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    ...H.shadow,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: H.primary },
  statLabel: { fontSize: 12, color: H.textMuted, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    backgroundColor: H.surface,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    ...H.shadow,
  },
  quickText: { fontSize: 11, fontWeight: '700', color: H.text },
  catalogMeta: { fontSize: 12, color: H.textMuted, marginBottom: 12 },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8EFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: H.primary,
  },
  resumeTitle: { fontSize: 15, fontWeight: '800', color: H.text },
  resumeSub: { fontSize: 12, color: H.textMuted, marginTop: 2 },
  errorBox: {
    backgroundColor: H.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorText: { color: H.textMuted, textAlign: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
