import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '../theme/colors';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

function AuthLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Checking session...</Text>
    </View>
  );
}

// AppLoader (RootNavigator) already covered the "app is warming up" moment
// with a full branded, animated loading presentation before this navigator
// ever mounts. This stack used to open on its own SplashScreen with an
// artificial ~2.8s delay on top of that — a second, more basic loading
// screen stacked right after the first. `initialAuthRoute` (resolved in
// App.js, in parallel with font/asset preload, before the native splash
// even hides) lets it open directly on Onboarding or Login instead, so
// there's exactly one loading moment, not two.
export default function AuthNavigator({ initialAuthRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialAuthRoute || 'Login'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: Colors.bgDark },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgDark,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeMD,
    marginTop: Spacing.lg,
  },
});
