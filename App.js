import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import React, { useCallback, useEffect, useState } from 'react';
import { LogBox, StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

import ErrorBoundary from './src/components/common/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { BibleProvider } from './src/context/BibleContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/theme/colors';
import { isOnboardingDone } from './src/storage';

// Must run before any navigator mounts. This switches React Navigation's
// bottom-tabs and native-stack from plain View-based screens to native,
// GPU-composited UIViewController/Fragment screens. Without this call,
// every tab you've ever visited keeps doing full JS-thread reconciliation
// and stays attached to the view hierarchy even while off-screen, which is
// the primary cause of laggy tab switching as more tabs get visited during
// a session. With it, inactive tabs are frozen/detached natively and tab
// switches become a native view swap instead of a React re-render.
enableScreens(true);

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Gesture handler is already enabled',
  'Uncaught Error in snapshot listener',
  '[Reanimated]',
  'Setting a timer',
]);

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.bgDark,
    card: Colors.bgCard,
    text: Colors.textPrimary,
    border: 'rgba(255,255,255,0.08)',
    notification: Colors.primary,
  },
};

// Images that appear on screen before any network round-trip completes —
// the native splash mark, the AppLoader mark, and the Onboarding carousel's
// first slide. Warming these into the image cache while the native splash
// is still covering the screen means the very first React-rendered frame
// (AppLoader, then Onboarding/Login) paints instantly instead of popping
// in a frame or two late.
const CRITICAL_IMAGES = [
  require('./assets/icon.png'),
  require('./assets/splash.png'),
  require('./assets/welcome.png'),
];

export default function App() {
  const [appReady, setAppReady] = useState(false);
  // Resolved once, up front, alongside font/asset preloading — so the
  // logged-out path can jump straight to Onboarding or Login without a
  // second screen re-deciding (and re-waiting on) the same AsyncStorage
  // lookup that used to live in the now-retired auth-flow Splash screen.
  const [initialAuthRoute, setInitialAuthRoute] = useState('Login');

  useEffect(() => {
    const prepare = async () => {
      try {
        const [, , onboarded] = await Promise.all([
          // Vector icons render as a custom font glyph — loading it up
          // front avoids the classic "tofu box then icon pops in" flash
          // the very first time an Ionicons glyph is drawn.
          Font.loadAsync(Ionicons.font),
          Asset.loadAsync(CRITICAL_IMAGES),
          isOnboardingDone(),
        ]);
        setInitialAuthRoute(onboarded ? 'Login' : 'Onboarding');
      } catch (e) {
        // Preloading is a nice-to-have, not a gate — if a font, image, or
        // the onboarding lookup fails (offline install, stripped asset,
        // corrupted storage, etc.) the app still boots normally, defaulting
        // to the safe Login route and loading anything missing lazily.
      } finally {
        setAppReady(true);
      }
    };
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <BibleProvider>
                    <NavigationContainer theme={navTheme}>
                      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
                      <View style={styles.root}>
                        <RootNavigator initialAuthRoute={initialAuthRoute} />
                      </View>
                    </NavigationContainer>
                  </BibleProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
});
