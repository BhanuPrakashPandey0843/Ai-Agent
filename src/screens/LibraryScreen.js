// src/screens/LibraryScreen.js
// Premium Library Redesign v2 - Production Ready
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
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

// Define feature data with asset paths.
// `hero` = full-bleed photo used at the top of the card.
// `icon` = the existing badge artwork (unchanged), overlaid on the hero photo.
// `accent` = per-card accent used only for the small chevron affordance / glow.
const FEATURES = [
  {
    id: 'dailyVerse',
    title: 'Daily Verse',
    description: 'A verse to strengthen your faith daily.',
    icon: require('../../assets/lib/book.png'),
    hero: require('../../assets/carosel/dailyverce.jpg'),
    accent: '#E08A3D',
    screen: 'DailyVerse',
  },
  {
    id: 'dailyPrayer',
    title: 'Prayer Room',
    description: 'Start your day with powerful prayer.',
    icon: require('../../assets/lib/hand.png'),
    hero: require('../../assets/carosel/prayerroom.jpg'),
    accent: '#8B5CF6',
    screen: 'DailyPrayer',
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    description: 'Faith-filled wallpapers for you.',
    icon: require('../../assets/lib/mountain.png'),
    hero: require('../../assets/carosel/wallpapaerlib.jpeg'),
    accent: '#22C55E',
    screen: 'Wallpapers',
  },
  {
    id: 'witness',
    title: 'Scripture Videos',
    description: 'Share your faith and inspire others.',
    icon: require('../../assets/lib/bird.png'),
    hero: require('../../assets/carosel/video.jpg'),
    accent: '#3B82F6',
    screen: 'Witness',
  },
];

const AnimatedFeatureCard = ({ item, index, onPress, isDark, colors, responsive }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const pressed = useSharedValue(0);
  const hasAnimated = useSharedValue(false);

  useEffect(() => {
    if (!hasAnimated.value) {
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

  const baseShadowOpacity = isDark ? 0.55 : 0.12;
  const baseElevation = isDark ? 10 : 5;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value + pressed.value * 2 },
    ],
    opacity: opacity.value,
    shadowOpacity: baseShadowOpacity - pressed.value * baseShadowOpacity * 0.55,
    shadowRadius: 16 - pressed.value * 6,
    elevation: baseElevation - pressed.value * 4,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97, { damping: 28, stiffness: 400, mass: 0.4 });
    pressed.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 28, stiffness: 400, mass: 0.4 });
    pressed.value = withTiming(0, { duration: 220 });
    onPress(item.screen);
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.featureCardWrapper,
        {
          backgroundColor: colors.bgCard,
          borderRadius: responsive.cardRadius,
          shadowColor: isDark ? '#000000' : '#1A1A2E',
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.featureCardInner,
          {
            borderRadius: responsive.cardRadius,
            backgroundColor: colors.bgCardSoft,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
          },
        ]}
      >
        {/* Hero photo */}
        <View style={[styles.heroWrap, { height: responsive.heroHeight }]}>
          <Image source={item.hero} style={styles.heroImage} resizeMode="cover" />

          {/* Soft top scrim for badge contrast */}
          <LinearGradient
            colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0.08)', 'transparent']}
            locations={[0, 0.32, 0.62]}
            style={styles.heroTopScrim}
            pointerEvents="none"
          />

          {/* Bottom blend into card body */}
          <LinearGradient
            colors={['transparent', `${colors.bgCardSoft}CC`, colors.bgCardSoft]}
            locations={[0.2, 0.7, 1]}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />
        </View>

        {/* Floating badge, overlapping the hero/body seam */}
        <View
          style={[
            styles.badgeRing,
            {
              width: responsive.badgeSize,
              height: responsive.badgeSize,
              borderRadius: responsive.badgeSize * 0.32,
              top: responsive.heroHeight - responsive.badgeSize * 0.62,
              left: responsive.cardBodyPadH,
              backgroundColor: colors.bgCardSoft,
              borderColor: colors.bgCardSoft,
              shadowColor: isDark ? colors.primary : item.accent,
              shadowOpacity: isDark ? 0.4 : 0.22,
            },
          ]}
        >
          <Image source={item.icon} style={styles.badgeImage} resizeMode="cover" />
        </View>

        {/* Text content */}
        <View
          style={[
            styles.cardTextContainer,
            {
              paddingHorizontal: responsive.cardBodyPadH,
              paddingTop: responsive.badgeSize * 0.55,
              paddingBottom: responsive.cardBodyPadB,
            },
          ]}
        >
          {isDark ? (
            <LinearGradient
              colors={['rgba(255,255,255,0.045)', 'transparent']}
              style={styles.cardTextSheen}
              pointerEvents="none"
            />
          ) : null}
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>

          <View style={styles.cardFooterRow}>
            <View
              style={[
                styles.chevronCircle,
                {
                  width: responsive.chevronSize,
                  height: responsive.chevronSize,
                  borderRadius: responsive.chevronSize / 2,
                  backgroundColor: isDark ? `${item.accent}33` : `${item.accent}1F`,
                  borderWidth: 1,
                  borderColor: isDark ? `${item.accent}40` : `${item.accent}2A`,
                },
              ]}
            >
              <Ionicons name="chevron-forward" size={responsive.chevronSize * 0.55} color={item.accent} />
            </View>
          </View>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const LiveWorshipCard = ({ onPress, isDark, colors, responsive }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const pressed = useSharedValue(0);
  const hasAnimated = useSharedValue(false);
  const dotPulse = useSharedValue(1);

  useEffect(() => {
    if (!hasAnimated.value) {
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
    dotPulse.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const baseShadowOpacity = isDark ? 0.5 : 0.16;
  const baseElevation = isDark ? 12 : 6;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
    shadowOpacity: baseShadowOpacity - pressed.value * baseShadowOpacity * 0.5,
    shadowRadius: 20 - pressed.value * 6,
    elevation: baseElevation - pressed.value * 4,
  }));

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotPulse.value }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.97, { damping: 28, stiffness: 400, mass: 0.4 });
    pressed.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 28, stiffness: 400, mass: 0.4 });
    pressed.value = withTiming(0, { duration: 220 });
    onPress('MeetShare');
  };

  const liveGradient = isDark
    ? ['#2A1B0C', '#1C1207', '#140C05']
    : ['#FFF3E6', '#FFE7CC', '#FFDDB8'];

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.liveCardWrapper,
        responsive.liveCardWrapper,
        {
          borderRadius: responsive.cardRadius,
          shadowColor: isDark ? '#E18A3A' : '#C96A1B',
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={liveGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.liveCard,
          {
            borderRadius: responsive.cardRadius,
            height: responsive.liveCardHeight,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)',
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['rgba(255,255,255,0.05)', 'transparent'] : ['rgba(255,255,255,0.55)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={[styles.liveLeftCol, { paddingLeft: responsive.cardBodyPadH }]}>
          <View style={[styles.liveIconOuter, { width: responsive.liveIconSize, height: responsive.liveIconSize }]}>
            <View
              style={[
                styles.liveIconRing,
                {
                  width: responsive.liveIconSize,
                  height: responsive.liveIconSize,
                  borderRadius: responsive.liveIconSize * 0.32,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                },
              ]}
            >
              <Image source={require('../../assets/lib/live.png')} style={styles.liveIconImage} resizeMode="cover" />
            </View>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, dotStyle]} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.liveTextContainer}>
            <Text style={[styles.liveTitle, { color: colors.textPrimary }]}>Live Worship Room</Text>
            <Text style={[styles.liveDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              Join live worship and connect with believers around the world.
            </Text>

            <View style={[styles.joinPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.joinPillText}>Join Now</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <View style={[styles.liveImageCol, { width: responsive.liveImageWidth, height: responsive.liveCardHeight }]}>
          <Image source={require('../../assets/carosel/live.jpg')} style={styles.liveHeroImage} resizeMode="cover" />
          <LinearGradient
            colors={[liveGradient[0], 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.liveHeroFade}
            pointerEvents="none"
          />
        </View>
      </LinearGradient>
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
      accentLine: { marginTop: rs(14, scale), marginBottom: rs(12, scale) },
      featureGrid: { rowGap: rs(16, scale), marginBottom: rs(20, scale) },
      cardRadius: rs(26, scale),
      heroHeight: rs(118, scale),
      badgeSize: rs(56, scale),
      cardBodyPadH: rs(16, scale),
      cardBodyPadB: rs(14, scale),
      chevronSize: rs(30, scale),
      liveCardWrapper: { marginBottom: rs(16, scale) },
      liveCardHeight: rs(196, scale),
      liveIconSize: rs(48, scale),
      liveImageWidth: rs(122, scale),
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
          <View style={[styles.accentLine, { backgroundColor: colors.primary }, responsive.accentLine]} />
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

  accentLine: {
    width: 52,
    height: 4,
    borderRadius: 999,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  featureCardWrapper: {
    width: '48%',
    shadowOffset: { width: 0, height: 8 },
  },

  featureCardInner: {
    overflow: 'hidden',
  },

  heroWrap: {
    width: '100%',
    overflow: 'hidden',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },

  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },

  badgeRing: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  badgeImage: {
    width: '100%',
    height: '100%',
  },

  cardTextContainer: {
    width: '100%',
    position: 'relative',
  },

  cardTextSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 34,
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },

  chevronCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  liveCardWrapper: {
    shadowOffset: { width: 0, height: 10 },
  },

  liveCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },

  liveLeftCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 14,
    justifyContent: 'center',
  },

  liveIconOuter: {
    marginBottom: 10,
  },

  liveIconRing: {
    overflow: 'hidden',
    borderWidth: 2,
  },

  liveIconImage: {
    width: '100%',
    height: '100%',
  },

  liveBadge: {
    position: 'absolute',
    bottom: -6,
    left: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  liveTextContainer: {
    maxWidth: '92%',
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

  joinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },

  joinPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  liveImageCol: {
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
    flexGrow: 0,
    alignSelf: 'stretch',
  },

  liveHeroImage: {
    width: '100%',
    height: '100%',
  },

  liveHeroFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '55%',
  },
});
