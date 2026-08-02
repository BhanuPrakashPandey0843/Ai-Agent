import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import ExpiredSubscriptionScreen from '../../screens/ExpiredSubscriptionScreen';
import SuspendedAccountScreen from '../../screens/SuspendedAccountScreen';
import AppLoader from './AppLoader';

export default function PremiumGuard({ children }) {
  const { subscriptionStatus, loading } = useSubscription();

  // Same loader component as RootNavigator's auth check — identical output
  // means this second, back-to-back loading gate is invisible to the user
  // instead of registering as a flash/flicker between two different UIs.
  if (loading) {
    return <AppLoader />;
  }

  if (subscriptionStatus === 'suspended') {
    return <SuspendedAccountScreen />;
  }

  if (subscriptionStatus === 'expired') {
    return <ExpiredSubscriptionScreen />;
  }

  // If none of the above, render the children
  return children;
}
