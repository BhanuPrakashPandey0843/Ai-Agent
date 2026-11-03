import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchQuizCatalog } from '../services/quizService';

export default function useQuizCatalog() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);

  const refresh = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const catalog = await fetchQuizCatalog(forceRefresh);
      setQuestionCount(Number(catalog.totalQuestions) || 0);
      setAttemptedCount(Number(catalog.attemptedCount) || 0);
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
