// src/screens/LibraryScreen.js
// Premium Library Redesign - Production Ready
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
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
    title: 'Daily Prayer',
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
    title: 'Witness',
    description: 'Share your faith and inspire others.',
    image: require('../../assets/lib/bird.png'),
    screen: 'Witness',
  },
];

const AnimatedFeatureCard = ({ item, index, onPress, isDark, colors }) => {
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
        }
      ]}>
        {/* Image at top, centered */}
        <View style={styles.imageContainer}>
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

const LiveWorshipCard = ({ onPress, isDark, colors }) => {
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
      style={[styles.liveCardWrapper, animatedStyle]}
    >
      <View style={[
        styles.liveCard, 
        { 
          backgroundColor: colors.bgCard,
        }
      ]}>
        <View style={styles.liveImageContainer}>
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.headerGreeting, { color: colors.textSecondary }]}>Welcome</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Library</Text>
          <View style={[styles.accentLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Grow in faith. Access helpful tools for your spiritual journey.
          </Text>
        </View>

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

        <LiveWorshipCard
          onPress={handlePress}
          isDark={isDark}
          colors={colors}
        />

        {/* Bottom padding for tab bar */}
        <View style={{ height: insets.bottom + 100 }} />
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

  headerSection: {
    marginBottom: 28,
  },

  headerGreeting: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
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
    marginTop: 14,
    marginBottom: 12,
  },

  headerSubtitle: {
    fontSize: 16,
    lineHeight: 26,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  featureCardWrapper: {
    width: '48%',
    marginBottom: 16,
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
    height: 215,
  },

  imageContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 18,
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

  liveCardWrapper: {
    marginBottom: 20,
  },

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
