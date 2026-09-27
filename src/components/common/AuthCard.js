import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BorderRadius, Spacing } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function AuthCard({ children, style, delay = 0 }) {
  const { colors, isDark, elevation } = useTheme();
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
      style={[
        styles.card,
        elevation('medium'),
        {
          backgroundColor: colors.bgCard,
          borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)',
          opacity: fade,
          transform: [{ scale }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xxl,
  },
});
