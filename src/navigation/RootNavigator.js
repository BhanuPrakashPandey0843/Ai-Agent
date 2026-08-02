import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PremiumGuard from '../components/common/PremiumGuard';
import AppLoader from '../components/common/AppLoader';

export default function RootNavigator({ initialAuthRoute }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  return user ? (
    <PremiumGuard>
      <MainNavigator />
    </PremiumGuard>
  ) : (
    <AuthNavigator initialAuthRoute={initialAuthRoute} />
  );
}
