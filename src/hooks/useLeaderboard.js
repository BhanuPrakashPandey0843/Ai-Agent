import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard } from '../services/quizService';

// Maps raw Firestore error codes to messages a person testing the app can
// actually act on, instead of a generic "Failed to load leaderboard" that
// looks identical whether the cause is no network, no data, or a Firestore
// config problem.
const describeLeaderboardError = (err) => {
  if (err?.code === 'permission-denied') {
    return 'Leaderboard access was denied by Firestore rules. The rules in firestore.rules may not be deployed to the live project yet.';
  }
  if (err?.code === 'unavailable') {
    return "Couldn't reach Firestore. Check your connection and try again.";
  }
  return err?.message || 'Failed to load leaderboard';
};

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
      setError(describeLeaderboardError(err));
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
