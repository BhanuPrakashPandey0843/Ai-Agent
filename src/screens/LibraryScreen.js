// src/screens/LibraryScreen.js
// Premium Library Hub — tabbed content screen
// All 6 content types: Verse · Prayer · Quotes · Study · Witness · Meet

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';

import DailyVerseScreen from './DailyVerseScreen';
import DailyPrayerScreen from './DailyPrayerScreen';
import QuotesScreen from './QuotesScreen';
import StudyPlansScreen from './StudyPlansScreen';
import WitnessScreen from './WitnessScreen';
import MeetShareScreen from './MeetShareScreen';

const { width: SCREEN_W } = Dimensions.get('window');

const TABS = [
  {
    id: 'verse',
    label: 'Verse',
    icon: 'book-open-outline',
    lib: 'Ionicons',
    color: '#558AFF',
    gradient: ['#0D1B3E', '#1a2a5e'],
  },
  {
    id: 'prayer',
    label: 'Prayer',
    icon: 'hands-pray',
    lib: 'MaterialCommunity',
    color: '#A855F7',
    gradient: ['#1a0d2e', '#2d1b4e'],
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: 'chatbubble-ellipses-outline',
    lib: 'Ionicons',
    color: '#FF6B00',
    gradient: ['#1a0a00', '#2d1500'],
  },
  {
    id: 'study',
    label: 'Study',
    icon: 'library-outline',
    lib: 'Ionicons',
    color: '#22C55E',
    gradient: ['#0a1a0a', '#1a3a1a'],
  },
  {
    id: 'witness',
    label: 'Witness',
    icon: 'people-outline',
    lib: 'Ionicons',
    color: '#F59E0B',
    gradient: ['#1a1200', '#2d2000'],
  },
  {
    id: 'meet',
    label: 'Meet',
    icon: 'videocam-outline',
    lib: 'Ionicons',
    color: '#06B6D4',
    gradient: ['#001a1a', '#002d2d'],
  },
];

function TabIcon({ tab, focused, size = 18 }) {
  const color = focused ? tab.color : Colors.textMuted;
  if (tab.lib === 'MaterialCommunity') {
    return <MaterialCommunityIcons name={tab.icon} size={size} color={color} />;
  }
  return <Ionicons name={tab.icon} size={size} color={color} />;
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const switchTab = useCallback(
    (index) => {
      if (index === activeTab) return;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveTab(index);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [activeTab, fadeAnim, translateY]
  );

  const activeTabData = TABS[activeTab];

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <DailyVerseScreen />;
      case 1: return <DailyPrayerScreen />;
      case 2: return <QuotesScreen />;
      case 3: return <StudyPlansScreen />;
      case 4: return <WitnessScreen />;
      case 5: return <MeetShareScreen />;
      default: return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>Library</Text>
          <Text style={styles.headerSub}>Your spiritual content hub</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.activeIndicator, { backgroundColor: activeTabData.color + '22', borderColor: activeTabData.color + '44' }]}>
            <TabIcon tab={activeTabData} focused size={16} />
            <Text style={[styles.activeIndicatorText, { color: activeTabData.color }]}>
              {activeTabData.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Pills */}
      <View style={styles.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab, index) => {
            const focused = index === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => switchTab(index)}
                activeOpacity={0.8}
                style={[
                  styles.tabPill,
                  focused && {
                    backgroundColor: tab.color + '18',
                    borderColor: tab.color + '50',
                  },
                ]}
              >
                <TabIcon tab={tab} focused={focused} size={15} />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? tab.color : Colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
                {focused && (
                  <View style={[styles.tabActiveDot, { backgroundColor: tab.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Thin accent line */}
      <View style={[styles.accentLine, { backgroundColor: activeTabData.color + '30' }]} />

      {/* Content with fade/slide animation */}
      <Animated.View
        style={[
          styles.contentArea,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  activeIndicatorText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  tabRow: {
    paddingBottom: Spacing.sm,
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: Typography.fontWeightBold,
  },
  tabActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 2,
  },
  accentLine: {
    height: 1,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
    borderRadius: 1,
  },
  contentArea: {
    flex: 1,
  },
});
