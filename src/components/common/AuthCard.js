import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../theme/colors';

export default function AuthCard({ children, style, delay = 0 }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fade, scale]);

  return (
    <Animated.View
      style={[styles.card, Shadows.card, { opacity: fade, transform: [{ scale }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
  },
});
