import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeTheme } from '../theme/homeTheme';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import QuizNavigator from './QuizNavigator';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WallpaperDetailScreen from '../screens/WallpaperDetailScreen';
import CategoryScreen from '../screens/CategoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const H = HomeTheme;

const TABS = [
  { name: 'Home', icon: 'home', iconOff: 'home-outline' },
  { name: 'Library', icon: 'library', iconOff: 'library-outline' },
  { name: 'Quiz', icon: 'bulb', iconOff: 'bulb-outline' },
  { name: 'Progress', icon: 'stats-chart', iconOff: 'stats-chart-outline' },
  { name: 'Settings', icon: 'settings', iconOff: 'settings-outline' },
];

/** Floating white tab bar — matches DreamTales mockup */
function DreamTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.navOuter, { paddingBottom: bottomPad }]}>
      <View style={[styles.navBar, HomeTheme.shadow]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const tab = TABS.find((t) => t.name === route.name) || TABS[0];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.navItem}
              onPress={onPress}
              activeOpacity={0.75}
            >
              {focused ? (
                <View style={styles.activeCircle}>
                  <Ionicons name={tab.icon} size={22} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons name={tab.iconOff} size={24} color={H.navInactive} />
              )}
              <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <DreamTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Quiz" component={QuizNavigator} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs" component={HomeTabs} />
      <Stack.Screen
        name="WallpaperDetail"
        component={WallpaperDetailScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  navOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: H.navBg,
    borderRadius: 32,
    height: 72,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: H.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: H.navInactive,
  },
  navLabelActive: {
    color: H.orange,
    fontWeight: '700',
  },
});
