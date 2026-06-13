import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getQuestionsCatalog, fetchAttemptedQuestionIds } from '../services/quizService';

export default function useQuizCatalog() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);

  const refresh = useCallback(async (forceRefresh = true) => {
    setLoading(true);
    setError(null);
    try {
      const [questions, attempted] = await Promise.all([
        getQuestionsCatalog(uid, { forceRefresh }),
        fetchAttemptedQuestionIds(uid),
      ]);
      setQuestionCount(questions.filter((q) => q.active !== false).length);
      setAttemptedCount(attempted.size);
    } catch (err) {
      setError(err?.message || 'Failed to load quiz catalog');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    questionCount,
    attemptedCount,
    refresh,
  };
}
