import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';
import GoldenButton from './GoldenButton';

function Particle({ delay, x, color }) {
  const y = useSharedValue(20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 180 }));
    y.value = withDelay(
      delay,
      withTiming(-120 - Math.random() * 80, { duration: 1100, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(delay, withTiming(180, { duration: 1100 }));
    opacity.value = withDelay(delay + 700, withTiming(0, { duration: 400 }));
  }, [delay, opacity, rotate, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          bottom: 40,
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function CelebrationCard({ title, body, scripture, onContinue, onExplore }) {
  const theme = useReadingPlanTheme();
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        delay: i * 40,
        x: 16 + i * 18,
        color: i % 2 === 0 ? theme.accent : theme.accentDark,
      })),
    [theme.accent, theme.accentDark]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.accent,
          borderRadius: theme.radius.card,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.confetti} pointerEvents="none">
        {particles.map((p) => (
          <Particle key={p.id} delay={p.delay} x={p.x} color={p.color} />
        ))}
      </View>

      <Animated.View entering={FadeInUp.duration(360)} style={[styles.check, { backgroundColor: theme.accent }]}>
        <Ionicons name="checkmark" size={28} color={theme.onAccent} />
      </Animated.View>
      <Text style={[theme.type.cardTitle, { color: theme.textPrimary, textAlign: 'center' }]}>{title}</Text>
      <Text style={[theme.type.bodySm, styles.body, { color: theme.textSecondary }]}>{body}</Text>
      {scripture ? (
        <Text style={[theme.type.caption, { color: theme.accent, textAlign: 'center', marginBottom: 16 }]}>
          {scripture}
        </Text>
      ) : null}
      <GoldenButton label="Continue" onPress={onContinue} icon="arrow-forward" />
      {onExplore ? (
        <Pressable onPress={onExplore} style={styles.link}>
          <Text style={[theme.type.caption, { color: theme.accent }]}>Explore other plans</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  confetti: {
    ...StyleSheet.absoluteFillObject,
  },
  check: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  body: { textAlign: 'center', marginTop: 8, marginBottom: 16 },
  link: { marginTop: 12, padding: 8 },
});

export default memo(CelebrationCard);
