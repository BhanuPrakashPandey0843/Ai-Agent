import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../../context/SubscriptionContext';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../theme/colors';
import ExpiredSubscriptionScreen from '../../screens/ExpiredSubscriptionScreen';
import SuspendedAccountScreen from '../../screens/SuspendedAccountScreen';

export default function PremiumGuard({ children }) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const navigation = useNavigation();
  const { subscriptionStatus, loading } = useSubscription();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
