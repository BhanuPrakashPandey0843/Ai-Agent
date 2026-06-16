// src/screens/LibraryScreen.js
// Premium Library Redesign with Animations & Dark/Light Mode
import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const FEATURES = [
  {
    id: 'dailyVerse',
    title: 'Daily Verse',
    description: 'A verse to strengthen your faith daily.',
    icon: 'book-outline',
    gradientKey: 'gradientVerse',
    screen: 'DailyVerse',
  },
  {
    id: 'dailyPrayer',
    title: 'Daily Prayer',
    description: 'Start your day with powerful prayer.',
    icon: 'heart-outline',
    gradientKey: 'gradientPrayer',
    screen: 'DailyPrayer',
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    description: 'Faith-filled wallpapers for your device.',
    icon: 'image-outline',
    gradientKey: 'gradientWallpaper',
    screen: 'Wallpapers',
  },
  {
    id: 'quotes',
    title: 'Quotes',
    description: 'Inspiring quotes to uplift your spirit.',
    icon: 'chatbubble-ellipses-outline',
    gradientKey: 'gradientQuotes',
    screen: 'Quotes',
  },
  {
    id: 'study',
    title: 'Study Plans',
    description: 'Deepen your understanding with guided plans.',
    icon: 'school-outline',
    gradientKey: 'gradientStudy',
    screen: 'StudyPlans',
  },
  {
    id: 'witness',
    title: 'Witness',
    description: 'Share your faith and inspire others.',
    icon: 'megaphone-outline',
    gradientKey: 'gradientWitness',
    screen: 'Witness',
  },
];

const AnimatedFeatureCard = ({ item, index, onPress, isDark, colors }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      delay: index * 100,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    onPress(item.screen);
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.featureCardWrapper, animatedStyle]}
    >
      <LinearGradient
        colors={colors[item.gradientKey]}
        style={[styles.featureCard, { backgroundColor: colors.bgCard }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name={item.icon} size={36} color="#FFFFFF" />
        </View>
        <Text style={[styles.featureTitle, { color: '#FFFFFF' }]}>{item.title}</Text>
        <Text style={[styles.featureDescription, { color: 'rgba(255,255,255,0.85)' }]}>
          {item.description}
        </Text>
        <View style={[styles.arrowButton, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
};

const LiveWorshipCard = ({ onPress, isDark, colors }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      delay: 700,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    onPress('MeetShare');
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.liveCardWrapper, animatedStyle]}
    >
      <LinearGradient
        colors={colors.gradientMeet}
        style={[styles.liveCard, { backgroundColor: colors.bgCard }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.liveIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="musical-notes" size={44} color="#FFFFFF" />
        </View>
        <View style={styles.liveTextContainer}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <Text style={[styles.liveTitle, { color: '#FFFFFF' }]}>Worship Room</Text>
          <Text style={[styles.liveDescription, { color: 'rgba(255,255,255,0.85)' }]}>
            Join live worship and connect with believers.
          </Text>
        </View>
        <View style={[styles.arrowButton, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
};

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, colors, Typography } = useTheme();

  const handlePress = (screen) => {
    const parentNav = navigation.getParent();
    if (parentNav?.getState().routeNames.includes(screen)) {
      parentNav.navigate(screen);
    } else {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: Typography.fontSize4XL }]}>
            Library
          </Text>
          <View style={[styles.accentLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: Typography.fontSizeLG }]}>
            Grow in faith. Access helpful tools for your spiritual journey.
          </Text>
        </View>

        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          {FEATURES.map((item, index) => (
            <AnimatedFeatureCard
              key={item.id}
              item={item}
              index={index}
              onPress={handlePress}
              isDark={isDark}
              colors={colors}
            />
          ))}
        </View>

        {/* Live Worship Card */}
        <LiveWorshipCard
          onPress={handlePress}
          isDark={isDark}
          colors={colors}
        />

        {/* Bottom padding for bottom nav */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  titleSection: {
    marginBottom: 32,
  },

  title: {
    fontWeight: '800',
    letterSpacing: -1.2,
  },

  accentLine: {
    width: 56,
    height: 4,
    borderRadius: 999,
    marginTop: 10,
  },

  subtitle: {
    lineHeight: 26,
    marginTop: 12,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  featureCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },

  featureCard: {
    borderRadius: 28,
    padding: 20,
    minHeight: 250,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  liveCardWrapper: {
    marginTop: 4,
  },

  liveCard: {
    borderRadius: 32,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  liveTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },

  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  liveTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  liveDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
