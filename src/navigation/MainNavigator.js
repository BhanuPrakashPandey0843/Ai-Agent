import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import QuizNavigator from './QuizNavigator';
import BibleNavigator from './BibleNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import WallpaperDetailScreen from '../screens/WallpaperDetailScreen';
import ProphetStoryDetailsScreen from '../screens/ProphetStoryDetailsScreen';
import CategoryScreen from '../screens/CategoryScreen';
import WallpapersScreen from '../screens/WallpapersScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WallpaperSettingsScreen from '../screens/WallpaperSettingsScreen';
import DailyVerseScreen from '../screens/DailyVerseScreen';
import DailyPrayerScreen from '../screens/DailyPrayerScreen';
import WitnessScreen from '../screens/WitnessScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import StudyPlansScreen from '../screens/StudyPlansScreen';
import AllFaithStoriesScreen from '../screens/AllFaithStoriesScreen';
import MeetShareScreen from '../screens/MeetShareScreen';
import QuotesScreen from '../screens/QuotesScreen';
import PaywallScreen from '../screens/PaywallScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import PaymentFailedScreen from '../screens/PaymentFailedScreen';
import ExpiredSubscriptionScreen from '../screens/ExpiredSubscriptionScreen';
import SuspendedAccountScreen from '../screens/SuspendedAccountScreen';
import RestoreAccessScreen from '../screens/RestoreAccessScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FavoriteWallpapersScreen from '../screens/FavoriteWallpapersScreen';
import FavoriteStoriesScreen from '../screens/FavoriteStoriesScreen';
import SavedVideosScreen from '../screens/SavedVideosScreen';
import BibleContentScreen from '../screens/BibleScreen';
import JesusContentScreen from '../screens/JesusScreen';
import PrayersContentScreen from '../screens/PrayersScreen';
import WorshipContentScreen from '../screens/WorshipScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import WritePrayerScreen from '../screens/WritePrayerScreen';
import CommunityPrayerDetailScreen from '../screens/CommunityPrayerDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name: 'Home', icon: 'home', iconOff: 'home-outline' },
  { name: 'Library', icon: 'library', iconOff: 'library-outline' },
  { name: 'Bible', icon: 'book', iconOff: 'book-outline' },
  { name: 'Quiz', icon: 'bulb', iconOff: 'bulb-outline' },
  { name: 'Settings', icon: 'settings', iconOff: 'settings-outline' },
];

function DreamTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const { colors, isDark } = useTheme();

  const navBg = isDark ? '#101010' : '#FFFFFF';
  const navInactive = isDark ? '#757575' : '#9CA3AF';
  const accentColor = colors.primary;
  const navShadow = isDark
    ? {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      };

  return (
    <View style={[styles.navOuter, { paddingBottom: bottomPad }]}>
      <View style={[styles.navBar, navShadow, { backgroundColor: navBg }]}>
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
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              {focused ? (
                <View style={[styles.activeCircle, { backgroundColor: accentColor }]}>
                  <Ionicons name={tab.icon} size={22} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons name={tab.iconOff} size={24} color={navInactive} />
              )}
              <Text style={[styles.navLabel, { color: focused ? accentColor : navInactive }, focused && styles.navLabelActive]}>{label}</Text>
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
      <Tab.Screen name="Bible" component={BibleNavigator} />
      <Tab.Screen name="Quiz" component={QuizNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
      <Stack.Screen name="Tabs" component={HomeTabs} />
      <Stack.Screen name="Wallpapers" component={WallpapersScreen} />
      <Stack.Screen
        name="WallpaperDetail"
        component={WallpaperDetailScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="WallpaperSettings" component={WallpaperSettingsScreen} />
      <Stack.Screen name="DailyVerse" component={DailyVerseScreen} />
      <Stack.Screen name="DailyPrayer" component={DailyPrayerScreen} />
      <Stack.Screen name="Witness" component={WitnessScreen} />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="ProphetStoryDetails" component={ProphetStoryDetailsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="StudyPlans" component={StudyPlansScreen} />
      <Stack.Screen name="AllFaithStories" component={AllFaithStoriesScreen} />
      <Stack.Screen name="MeetShare" component={MeetShareScreen} />
      <Stack.Screen name="Quotes" component={QuotesScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="PaymentFailed" component={PaymentFailedScreen} />
      <Stack.Screen name="ExpiredSubscription" component={ExpiredSubscriptionScreen} />
      <Stack.Screen name="SuspendedAccount" component={SuspendedAccountScreen} />
      <Stack.Screen name="RestoreAccess" component={RestoreAccessScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="FavoriteWallpapers" component={FavoriteWallpapersScreen} />
      <Stack.Screen name="FavoriteStories" component={FavoriteStoriesScreen} />
      <Stack.Screen name="SavedVideos" component={SavedVideosScreen} />
      <Stack.Screen name="BibleContent" component={BibleContentScreen} />
      <Stack.Screen name="JesusContent" component={JesusContentScreen} />
      <Stack.Screen name="PrayersContent" component={PrayersContentScreen} />
      <Stack.Screen name="WorshipContent" component={WorshipContentScreen} />
      <Stack.Screen
        name="ContentDetail"
        component={ContentDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WritePrayer"
        component={WritePrayerScreen}
        options={{ animation: 'slide_from_bottom', freezeOnBlur: true }}
      />
      <Stack.Screen
        name="CommunityPrayerDetail"
        component={CommunityPrayerDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    fontWeight: '700',
  },
});
