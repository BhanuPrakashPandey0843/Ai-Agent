
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToSavedVideos } from '../services/firebaseService';

export default function useSavedVideos() {
  const { user } = useAuth();
  const [savedVideos, setSavedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setSavedVideos([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToSavedVideos(
      user.uid,
      (videos) => {
        setSavedVideos(videos);
        setLoading(false);
      },
      (err) => {
        console.error('[useSavedVideos]', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  return { savedVideos, loading, error };
}
