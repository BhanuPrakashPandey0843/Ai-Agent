import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard } from '../services/quizService';

export default function useLeaderboard(period = 'daily') {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(period, 50);
      setEntries(data);
    } catch (err) {
      setError(err?.message || 'Failed to load leaderboard');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, error, refresh };
}
