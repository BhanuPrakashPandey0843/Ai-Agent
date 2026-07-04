import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, BorderRadius, Spacing, Colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const GradientButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  colors,
  style,
  textStyle,
  size = 'lg',
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const { colors: themeColors, isDark } = useTheme();

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();

  const isSmall = size === 'sm';
  const buttonColors = colors || themeColors.gradientPrimary;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={disabled ? (isDark ? ['#3a3a3a', '#2a2a2a'] : ['#d1d5db', '#9ca3af']) : buttonColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, isSmall && styles.gradientSm]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[styles.text, isSmall && styles.textSm, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  gradientSm: {
    minHeight: 44,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  text: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: Typography.fontSizeMD,
  },
});

export default GradientButton;
