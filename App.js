import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';

import React, { useCallback, useEffect, useState } from 'react';
import { LogBox, StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
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

export default function App() {
  console.log('App is rendering');
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        // ignore init warnings
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
                        <RootNavigator />
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
