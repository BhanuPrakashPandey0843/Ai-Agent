import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getQuizProfile } from '../services/quizService';

export default function useQuizProfile() {
  const { user, refreshProfile } = useAuth();
  const uid = user?.uid;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getQuizProfile(uid);
      setProfile(data);
      if (refreshProfile) await refreshProfile();
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [uid, refreshProfile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}
