import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const defaultQuizProfile = () => ({
  xp: 0,
  level: 1,
  totalQuizzes: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  totalWrong: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  bestScore: 0,
  bestAccuracy: 0,
  fastestTimeMs: null,
  categoryStats: {},
  achievements: [],
  reachedTop10: false,
});

// The Quiz module's profile is just the `quizProfile` field of the same
// users/{uid} document AuthContext already fetches on login/app start (and
// keeps current after a quiz submission via patchUserProfile). Deriving it
// here instead of doing an independent getDoc() avoids fetching that exact
// same document twice on every Quiz Home mount. `refresh` is kept for API
// compatibility and delegates to AuthContext's own refreshProfile when a
// caller explicitly wants to force a fresh read from Firestore.
export default function useQuizProfile() {
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();

  const profile = useMemo(() => {
    if (!user?.uid) return null;
    return { ...defaultQuizProfile(), ...(userProfile?.quizProfile || {}) };
  }, [user?.uid, userProfile]);

  return {
    profile,
    loading: authLoading,
    refresh: refreshProfile,
  };
}
