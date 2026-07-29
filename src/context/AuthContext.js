// src/context/AuthContext.js — Firebase Auth state management
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS } from '../constants';

const AuthContext = createContext(null);

// Pure function of its argument — hoisted out of the component so it isn't
// recreated on every render and doesn't need to appear in any dependency array.
const buildFallbackProfile = (firebaseUser) => ({
  name: firebaseUser.displayName || 'Believer',
  email: firebaseUser.email || '',
  photoURL: firebaseUser.photoURL || '',
  isPremium: false,
  coins: 0,
  lastScore: 0,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Profile from Auth first; enrich from Firestore when rules allow
  const fetchUserProfile = useCallback(async (uid, firebaseUser = auth.currentUser) => {
    if (!firebaseUser) return;
    setUserProfile(buildFallbackProfile(firebaseUser));
    setIsPremium(false);
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setIsPremium(data.isPremium === true);
      }
    } catch {
      /* keep auth-based fallback profile */
    }
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid, firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsPremium(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Sign in with email + password
  const login = useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserProfile(result.user.uid, result.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUserProfile]);

  // Create account + Firestore user document
  const signup = useCallback(async (name, email, password) => {
    let firebaseUser;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = result.user;
      await updateProfile(firebaseUser, { displayName: name });
    } catch (err) {
      return { success: false, error: err.message };
    }

    let profileError = null;
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        name,
        email,
        photoURL: firebaseUser.photoURL || '',
        address: '',
        isPremium: false,
        lastScore: 0,
        lastPlayed: new Date(),
        updatedAt: Date.now(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      profileError = err.message;
    }

    await fetchUserProfile(firebaseUser.uid, firebaseUser);
    sendEmailVerification(firebaseUser).catch(() => {});

    if (profileError) {
      // Auth succeeded, but profile failed — still return success, but add a warning
      return { success: true, profileError: 'Profile creation failed temporarily. Your account was created.' };
    }
    return { success: true };
  }, [fetchUserProfile]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore logout errors
    }
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (updates) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        ...updates,
        updatedAt: Date.now(),
      });
      if (updates.name) {
        await updateProfile(user, { displayName: updates.name });
      }
      await fetchUserProfile(user.uid, user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user, fetchUserProfile]);

  // Social login stubs — wire up @react-native-google-signin or expo-apple-authentication
  const signInWithGoogle = useCallback(async () => ({
    success: false,
    error: 'Google Sign-In not configured yet. Add expo-auth-session or @react-native-google-signin/google-signin.',
  }), []);

  const signInWithApple = useCallback(async () => ({
    success: false,
    error: 'Apple Sign-In not configured yet. Add expo-apple-authentication.',
  }), []);

  const resendVerification = useCallback(async () => {
    if (!user) return { success: false, error: 'Not signed in' };
    try {
      await sendEmailVerification(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);

  const refreshProfile = useCallback(
    () => user && fetchUserProfile(user.uid, user),
    [user, fetchUserProfile]
  );

  // Merges a partial profile update into local state only, without a
  // Firestore round trip. For callers that already hold the fresh data
  // from a write they just performed (e.g. quiz submission returning
  // the updated quizProfile) - avoids re-fetching the same document
  // that was just written.
  const patchUserProfile = useCallback(
    (patch) => setUserProfile((prev) => ({ ...(prev || buildFallbackProfile(user || {})), ...patch })),
    [user]
  );

  // Memoized so the context value's identity only changes when something in
  // it actually changed — otherwise every consumer of useAuth() across the
  // app (HomeScreen, SettingsScreen, useQuizProfile, useSavedVideos, etc.)
  // re-renders on every AuthProvider render, even ones triggered by state
  // this particular consumer doesn't care about.
  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      isPremium,
      login,
      signup,
      logout,
      forgotPassword,
      updateUserProfile,
      signInWithGoogle,
      signInWithApple,
      resendVerification,
      refreshProfile,
      patchUserProfile,
    }),
    [
      user,
      userProfile,
      loading,
      isPremium,
      login,
      signup,
      logout,
      forgotPassword,
      updateUserProfile,
      signInWithGoogle,
      signInWithApple,
      resendVerification,
      refreshProfile,
      patchUserProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
