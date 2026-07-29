// src/screens/LibraryScreen.js
// Premium Library Redesign - Production Ready
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// --- Responsive scaling -----------------------------------------------
// Typography, colors, icons, card order and animations never change.
// Only spacing/sizing metrics (padding, margins, container dimensions)
// scale down proportionally on shorter viewports so all 5 cards
// ("Daily Verse" through "Live Worship Room") are visible without
// scrolling on any supported device, while staying visually identical
// (scale === 1) on the larger devices the design already fit on.
const DESIGN_HEIGHT = 852; // reference viewport height the fixed design was authored for
const MIN_SCALE = 0.72; // floor so spacing never collapses on very small devices

const rs = (value, scale) => Math.round(value * scale);

function useLibraryScale() {
  const { height } = useWindowDimensions();
  return useMemo(
    () => Math.min(1, Math.max(MIN_SCALE, height / DESIGN_HEIGHT)),
    [height]
  );
}

// Define feature data with asset paths
const FEATURES = [
  {
    id: 'dailyVerse',
    title: 'Daily Verse',
    description: 'A verse to strengthen your faith daily.',
    image: require('../../assets/lib/book.png'),
    screen: 'DailyVerse',
  },
  {
    id: 'dailyPrayer',
    title: 'Prayer Room',
    description: 'Start your day with powerful prayer.',
    image: require('../../assets/lib/hand.png'),
    screen: 'DailyPrayer',
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    description: 'Faith-filled wallpapers for you.',
    image: require('../../assets/lib/mountain.png'),
    screen: 'Wallpapers',
  },
  {
    id: 'witness',
    title: 'Scripture Videos',
    description: 'Share your faith and inspire others.',
    image: require('../../assets/lib/bird.png'),
    screen: 'Witness',
  },
];

const AnimatedFeatureCard = ({ item, index, onPress, isDark, colors, responsive }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1); // Start visible
  const translateY = useSharedValue(0); // Start in place
  const hasAnimated = useSharedValue(false);

  useEffect(() => {
    if (!hasAnimated.value) {
      // Only run animation on first mount
      hasAnimated.value = true;
      opacity.value = withTiming(1, {
        duration: 600,
        delay: index * 80,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 600,
        delay: index * 80,
        easing: Easing.out(Easing.ease),
      });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97, { damping: 28, stiffness: 400, mass: 0.4 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 28, stiffness: 400, mass: 0.4 });
    onPress(item.screen);
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.featureCardWrapper, animatedStyle]}
    >
      <View style={[
        styles.featureCard, 
        { 
          backgroundColor: colors.bgCard,
        },
        responsive.featureCard,
      ]}>
        {/* Image at top, centered */}
        <View style={[styles.imageContainer, responsive.imageContainer]}>
          <Image source={item.image} style={styles.featureImage} />
        </View>
        
        {/* Text content */}
        <View style={styles.cardTextContainer}>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const LiveWorshipCard = ({ onPress, isDark, colors, responsive }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1); // Start visible
  const translateY = useSharedValue(0); // Start in place
  const hasAnimated = useSharedValue(false);

  useEffect(() => {
    if (!hasAnimated.value) {
      // Only run animation on first mount
      hasAnimated.value = true;
      opacity.value = withTiming(1, {
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.ease),
      });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.97, { damping: 28, stiffness: 400, mass: 0.4 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 28, stiffness: 400, mass: 0.4 });
    onPress('MeetShare');
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.liveCardWrapper, animatedStyle, responsive.liveCardWrapper]}
    >
      <View style={[
        styles.liveCard, 
        { 
          backgroundColor: colors.bgCard,
        },
        responsive.liveCard,
      ]}>
        <View style={[styles.liveImageContainer, responsive.liveImageContainer]}>
          <Image source={require('../../assets/lib/live.png')} style={styles.liveImage} />
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.liveTextContainer}>
          <Text style={[styles.liveTitle, { color: colors.textPrimary }]}>Live Worship Room</Text>
          <Text style={[styles.liveDescription, { color: colors.textSecondary }]}>
            Join live worship and connect with believers around the world.
          </Text>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const scale = useLibraryScale();

  // Scaled overrides for spacing/sizing only - typography, colors, icons,
  // card order and animations are untouched. At scale === 1 (the design's
  // reference height and above) every value below equals the original
  // hardcoded constant, so larger devices render pixel-identical to before.
  const responsive = useMemo(
    () => ({
      contentTopExtra: rs(20, scale),
      headerSection: { marginBottom: rs(28, scale) },
      headerGreeting: { marginBottom: rs(4, scale) },
      accentLine: { marginTop: rs(14, scale), marginBottom: rs(12, scale) },
      featureGrid: { rowGap: rs(16, scale), marginBottom: rs(20, scale) },
      featureCard: { padding: rs(18, scale) },
      imageContainer: {
        width: rs(76, scale),
        height: rs(76, scale),
        marginBottom: rs(16, scale),
      },
      liveCardWrapper: { marginBottom: rs(16, scale) },
      liveCard: { padding: rs(18, scale) },
      liveImageContainer: { width: rs(70, scale), height: rs(70, scale) },
      bottomSpacerHeight: Math.max(60, rs(90, scale)),
    }),
    [scale]
  );

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
        backgroundColor={colors.bg}
        translucent
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + responsive.contentTopExtra },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerSection, responsive.headerSection]}>
          <Text style={[styles.headerGreeting, { color: colors.textSecondary }, responsive.headerGreeting]}>Welcome</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Library</Text>
          <View style={[styles.accentLine, { backgroundColor: colors.primary }, responsive.accentLine]} />
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Grow in faith. Access helpful tools for your spiritual journey.
          </Text>
        </View>

        <View style={[styles.featureGrid, responsive.featureGrid]}>
          {FEATURES.map((item, index) => (
            <AnimatedFeatureCard
              key={item.id}
              item={item}
              index={index}
              onPress={handlePress}
              isDark={isDark}
              colors={colors}
              responsive={responsive}
            />
          ))}
        </View>

        <LiveWorshipCard
          onPress={handlePress}
          isDark={isDark}
          colors={colors}
          responsive={responsive}
        />

        {/* Bottom padding for tab bar */}
        <View style={{ height: insets.bottom + responsive.bottomSpacerHeight }} />
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

  headerSection: {},

  headerGreeting: {
    fontSize: 15,
    fontWeight: '500',
  },

  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },

  accentLine: {
    width: 52,
    height: 4,
    borderRadius: 999,
  },

  headerSubtitle: {
    fontSize: 16,
    lineHeight: 26,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  featureCardWrapper: {
    width: '48%',
  },

  featureCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'column',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  imageContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
  },

  featureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  cardTextContainer: {
    width: '100%',
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  liveCardWrapper: {},

  liveCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  liveImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },

  liveImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  liveTextContainer: {
    flex: 1,
  },

  liveBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },

  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  liveTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },

  liveDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
