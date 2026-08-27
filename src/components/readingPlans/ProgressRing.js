import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Animated circular progress ring. `progress` is 0-100.
 */
export default function ProgressRing({
  size = 128,
  strokeWidth = 10,
  progress = 0,
  color = '#D4AF37',
  trackColor = 'rgba(212,175,55,0.16)',
  label,
  sublabel,
  labelColor = '#FFFFFF',
  sublabelColor = '#B8B2A6',
  children,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, clamped]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value / 100),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children ? (
        children
      ) : (
        <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
          {label ? (
            <Text style={{ fontSize: Math.round(size * 0.2), fontWeight: '700', color: labelColor }}>
              {label}
            </Text>
          ) : null}
          {sublabel ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color: sublabelColor,
                marginTop: 2,
              }}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
