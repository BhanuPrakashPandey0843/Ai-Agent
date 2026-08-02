// src/components/common/AppLoader.js
// Premium initial-loading presentation — shown while the app resolves auth
// state and subscription status before the first real screen can mount.
// Reused by RootNavigator (auth check) and PremiumGuard (subscription
// check) so both gates render pixel-identical output; swapping between
// them is invisible instead of a flash between two different loaders.
//
// Design intent: continue the native splash (same dark background, same
// mark) rather than cut to something new. A soft two-layer radial glow
// breathes behind the mark, a slim gold ring drifts slowly around it, and
// a handful of small light motes rise and fade around the halo — a quiet
// "divine light" motif that fits a faith app without being literal. The
// wordmark reveals letter-by-letter, a slim rule draws in beneath it, and
// the whole scene keeps breathing in an ambient loop for however long
// resolution takes — no fixed minimum display time is enforced, so a fast
// resolve never gets held up waiting on the animation. Everything runs on
// Reanimated's UI thread so it stays a smooth 60fps regardless of what's
// happening on the JS thread while auth/subscription state resolves.
//
// `hasPlayedIntro` is deliberately module-level, not component state:
// RootNavigator and PremiumGuard mount this component back-to-back (auth
// gate, then subscription gate) for any logged-in user. Without this flag
// the second mount would replay the whole entrance — mark shrinking back
// down and springing in again — which reads as a stutter, not a fresh
// screen. Once the intro has played once during this app session, later
// mounts skip straight to the settled ambient state.
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../theme/colors';

let hasPlayedIntro = false;

const MARK_SIZE = 156;
const RING_RADIUS = 72;
const RING_STROKE = 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_ARC = RING_CIRCUMFERENCE * 0.16;
const LOGO_SIZE = 104;
const GOLD = '#D4AF37';

const WORDMARK = 'Faith Frames';
const TAGLINE = 'PREMIUM FAITH WALLPAPERS';
const BREATHE_EASE = Easing.inOut(Easing.ease);

// Fixed (not random-per-render) so the halo layout is stable across
// renders — angles/radii hand-picked to sit just outside the ring.
const PARTICLES = [
  { angle: -40, radius: 100, size: 4, delay: 0, duration: 3400 },
  { angle: 25, radius: 112, size: 3, delay: 500, duration: 3800 },
  { angle: 200, radius: 96, size: 3.5, delay: 1000, duration: 3200 },
  { angle: 150, radius: 108, size: 3, delay: 1600, duration: 4000 },
  { angle: 80, radius: 90, size: 2.5, delay: 2100, duration: 3600 },
  { angle: -110, radius: 104, size: 3, delay: 2600, duration: 3500 },
];

function Glow({ gradId, size, color, delay, phase }) {
  const pulse = useSharedValue(phase);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(withTiming(1 - phase, { duration: 2400, easing: BREATHE_EASE }), -1, true)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 0.28 + pulse.value * 0.34,
    transform: [{ scale: 0.92 + pulse.value * 0.18 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.center, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <Stop offset="60%" stopColor={color} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

function Particle({ angle, radius, size, delay, duration, color }) {
  const rad = (angle * Math.PI) / 180;
  const baseX = Math.cos(rad) * radius;
  const baseY = Math.sin(rad) * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false)
    );
  }, []);

  const style = useAnimatedStyle(() => {
    'worklet';
    const rise = progress.value * 22;
    const fadeIn = Math.min(progress.value / 0.25, 1);
    const fadeOut = 1 - Math.max((progress.value - 0.7) / 0.3, 0);
    const alpha = Math.max(Math.min(fadeIn, fadeOut), 0);
    return {
      opacity: alpha * 0.85,
      transform: [
        { translateX: baseX },
        { translateY: baseY - rise },
        { scale: 0.6 + progress.value * 0.5 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function AnimatedChar({ char, delay, color }) {
  const progress = useSharedValue(hasPlayedIntro ? 1 : 0);

  useEffect(() => {
    if (hasPlayedIntro) return;
    progress.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  if (char === ' ') return <View style={styles.charSpace} />;

  return (
    <Animated.Text style={[styles.wordmarkChar, { color }, style]}>
      {char}
    </Animated.Text>
  );
}

export default function AppLoader() {
  const { colors } = useTheme();
  const skip = hasPlayedIntro;

  const logoScale = useSharedValue(skip ? 1 : 0.82);
  const logoOpacity = useSharedValue(skip ? 1 : 0);
  const ringOpacity = useSharedValue(skip ? 1 : 0);
  const ringRotate = useSharedValue(0);
  const iconBreathe = useSharedValue(0);
  const taglineOpacity = useSharedValue(skip ? 1 : 0);
  const ruleScale = useSharedValue(skip ? 1 : 0);

  const chars = useMemo(() => WORDMARK.split(''), []);
  const wordmarkDelayBase = 260;
  const wordmarkDuration = chars.length * 34;
  const taglineDelay = wordmarkDelayBase + wordmarkDuration + 160;
  const ruleDelay = taglineDelay + 260;

  useEffect(() => {
    // Continuous ambient loops start immediately regardless of intro state,
    // so the second (PremiumGuard) mount still feels alive, not frozen.
    ringRotate.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false);
    iconBreathe.value = withRepeat(withTiming(1, { duration: 2600, easing: BREATHE_EASE }), -1, true);

    if (skip) return;

    logoOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 9, stiffness: 90 });
    ringOpacity.value = withDelay(140, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(taglineDelay, withTiming(1, { duration: 500 }));
    ruleScale.value = withDelay(ruleDelay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));

    hasPlayedIntro = true;
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * (1 + iconBreathe.value * 0.015) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  const ruleStyle = useAnimatedStyle(() => ({
    opacity: ruleScale.value,
    transform: [{ scaleX: ruleScale.value }],
  }));

  const particleColor = colors.primaryLight;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.markWrap}>
        <Glow gradId="ffGlowOuter" size={MARK_SIZE + 60} color={colors.primary} delay={0} phase={0} />
        <Glow gradId="ffGlowInner" size={MARK_SIZE + 10} color={GOLD} delay={300} phase={1} />

        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} color={i % 2 === 0 ? particleColor : GOLD} />
        ))}

        <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none">
          <Svg width={MARK_SIZE} height={MARK_SIZE}>
            <Circle
              cx={MARK_SIZE / 2}
              cy={MARK_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.primary}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${RING_ARC} ${RING_CIRCUMFERENCE}`}
              fill="none"
              opacity={0.85}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.logoRing, { borderColor: colors.borderAccent }, logoStyle]}>
          <Image source={require('../../../assets/icon.png')} style={styles.logo} />
        </Animated.View>
      </View>

      <View style={styles.wordmarkRow}>
        {chars.map((c, i) => (
          <AnimatedChar key={i} char={c} delay={wordmarkDelayBase + i * 34} color={colors.textPrimary} />
        ))}
      </View>

      <Animated.View style={[styles.rule, { backgroundColor: colors.borderAccent }, ruleStyle]} />

      <Animated.Text style={[styles.tagline, { color: colors.primaryLight }, taglineStyle]}>
        {TAGLINE}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    width: MARK_SIZE + 60,
    height: MARK_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  ring: {
    position: 'absolute',
    width: MARK_SIZE,
    height: MARK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkChar: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    letterSpacing: 0.4,
  },
  charSpace: {
    width: 8,
  },
  rule: {
    width: 40,
    height: 1.5,
    borderRadius: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 2,
  },
});
