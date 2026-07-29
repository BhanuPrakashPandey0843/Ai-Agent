// src/context/SubscriptionContext.js — Subscription state management
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../config/firebase';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get user's ID token with custom claims
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const claims = idTokenResult.claims;

        setSubscriptionStatus(claims.subscriptionStatus || 'inactive');
        setIsPremium(claims.isPremium || false);
        setSubscriptionExpiry(claims.subscriptionExpiry ? new Date(claims.subscriptionExpiry) : null);
        setPlanId(claims.planId || null);
      } else {
        setSubscriptionStatus('inactive');
        setIsPremium(false);
        setSubscriptionExpiry(null);
        setPlanId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (auth.currentUser) {
      // Force refresh ID token to get latest claims
      await auth.currentUser.getIdToken(true);
    }
  }, []);

  // Memoized so PremiumGuard (which sits directly above every bottom-tab
  // screen) and any other consumer only re-render when a subscription field
  // actually changes, not on every SubscriptionProvider render.
  const value = useMemo(
    () => ({
      subscriptionStatus,
      isPremium,
      subscriptionExpiry,
      planId,
      loading,
      refreshSubscription,
    }),
    [subscriptionStatus, isPremium, subscriptionExpiry, planId, loading, refreshSubscription]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
};
