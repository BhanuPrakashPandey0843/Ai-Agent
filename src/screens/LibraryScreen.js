// src/screens/LibraryScreen.js
// Premium Library Redesign with Tabbed Content
// Inspired by premium Christian apps

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';
import { HomeTheme } from '../theme/homeTheme';

import DailyVerseScreen from './DailyVerseScreen';
import DailyPrayerScreen from './DailyPrayerScreen';
import QuotesScreen from './QuotesScreen';
import StudyPlansScreen from './StudyPlansScreen';
import WitnessScreen from './WitnessScreen';
import MeetShareScreen from './MeetShareScreen';

const { width: SCREEN_W } = Dimensions.get('window');

// Original Tabs
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

// Feature Grid Data
const FEATURES = [
  {
    id: 'dailyVerse',
    title: 'Daily Verse',
    category: 'SCRIPTURE',
    description: "Divine wisdom and light for your path",
    icon: 'book-open-outline',
    iconLib: 'Ionicons',
    color: '#FF6B00',
    tabIndex: 0,
  },
  {
    id: 'dailyPrayer',
    title: 'Daily Prayer',
    category: 'CONNECTION',
    description: "A quiet space for your conversation with God",
    icon: 'hands-pray',
    iconLib: 'MaterialCommunity',
    color: '#A855F7',
    tabIndex: 1,
  },
  {
    id: 'quotes',
    title: "God's Words",
    category: 'WISDOM',
    description: "Timeless truths extracted for daily life",
    icon: 'chatbubble-ellipses-outline',
    iconLib: 'Ionicons',
    color: '#22C55E',
    tabIndex: 2,
  },
  {
    id: 'witness',
    title: 'The Witness',
    category: 'STORIES',
    description: "Real faith stories from the community",
    icon: 'people-outline',
    iconLib: 'Ionicons',
    color: '#F59E0B',
    tabIndex: 4,
  },
  {
    id: 'studyPlans',
    title: 'Study Plans',
    category: 'GROWTH',
    description: "Guided journeys through Scripture",
    icon: 'library-outline',
    iconLib: 'Ionicons',
    color: '#10B981',
    tabIndex: 3,
  },
];

// Daily Wisdom Cards
const WISDOM_CARDS = [
  {
    id: 1,
    title: "Today's Verse",
    text: "For God so loved the world that he gave his one and only Son.",
    reference: "John 3:16",
  },
  {
    id: 2,
    title: "Daily Inspiration",
    text: "The Lord is my light and my salvation; whom shall I fear?",
    reference: "Psalm 27:1",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  if (hour < 21) return "GOOD EVENING";
  return "GOOD NIGHT";
}

function Icon({ name, lib, size, color }) {
  if (lib === 'MaterialCommunity') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

function WisdomCard({ item, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          styles.wisdomCard,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.wisdomText}>{item.text}</Text>
        <Text style={styles.wisdomReference}>★ {item.reference}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function FeatureCard({ item, index, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.featureCardWrapper}
      activeOpacity={0.9}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => onPress(item.tabIndex)}
    >
      <Animated.View
        style={[
          styles.featureCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Icon name={item.icon} lib={item.iconLib} size={36} color={item.color} />
        </View>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureCategory}>{item.category}</Text>
        <Text style={styles.featureDescription}>{item.description}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabIcon({ tab, focused, size = 18 }) {
  const color = focused ? tab.color : Colors.textMuted;
  if (tab.lib === 'MaterialCommunity') {
    return <MaterialCommunityIcons name={tab.icon} size={size} color={color} />;
  }
  return <Ionicons name={tab.icon} size={size} color={color} />;
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [greeting, setGreeting] = useState(getGreeting());
  const [activeTab, setActiveTab] = useState(null); // null = home view
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  const switchTab = useCallback(
    (index) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveTab(index);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, translateY]
  );

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
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Home View */}
      {activeTab === null && (
        <ScrollView
          style={[styles.scrollView, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Area */}
          <View style={styles.heroArea}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.title}>Library</Text>
            <View style={styles.accentLine} />
          </View>

          {/* Daily Wisdom Section */}
          <View style={styles.dailyWisdomSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={24} color={HomeTheme.orange} />
              <Text style={styles.sectionTitle}>DAILY WISDOM</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wisdomScroll}
            >
              {WISDOM_CARDS.map((item, index) => (
                <WisdomCard key={item.id} item={item} index={index} />
              ))}
            </ScrollView>
          </View>

          {/* Feature Grid */}
          <View style={styles.featureGridSection}>
            <View style={styles.featureGrid}>
              {FEATURES.map((item, index) => (
                <FeatureCard
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={(tabIdx) => switchTab(tabIdx)}
                />
              ))}
            </View>
          </View>

          {/* Bottom padding for bottom nav */}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Tabbed Content View */}
      {activeTab !== null && (
        <View style={styles.tabContentView}>
          {/* Custom Header for Tabs */}
          <View style={[styles.tabHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setActiveTab(null)}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TabIcon tab={TABS[activeTab]} focused size={20} />
              <Text style={[styles.headerTitle, { color: TABS[activeTab].color }]}>
                {TABS[activeTab].label}
              </Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroArea: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  greeting: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'System',
    fontSize: Typography.fontSize4XL,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1.5,
  },
  accentLine: {
    width: 48,
    height: 4,
    backgroundColor: HomeTheme.orange,
    borderRadius: 2,
    marginTop: Spacing.md,
  },
  dailyWisdomSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  wisdomScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  wisdomCard: {
    width: SCREEN_W * 0.75,
    padding: 32,
    borderRadius: 32,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  wisdomText: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 16,
  },
  wisdomReference: {
    fontSize: 16,
    fontWeight: '600',
    color: HomeTheme.orange,
  },
  featureGridSection: {
    paddingHorizontal: Spacing.xl,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCardWrapper: {
    width: '47%',
  },
  featureCard: {
    width: '100%',
    padding: 24,
    borderRadius: 32,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  featureCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Tab View Styles
  tabContentView: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  tabRow: {
    paddingBottom: Spacing.md,
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
  contentArea: {
    flex: 1,
  },
});
