import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '../../theme/colors';

/**
 * Compact premium pill button — single line, no wrap, height 48-52, radius 18.
 * Optional `progress` (0-1) renders a subtle fill so real download/set
 * progress is visible without needing extra chrome.
 */
export default function CompactActionButton({
  title,
  icon,
  onPress,
  loading = false,
  disabled = false,
  progress,
  colors,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const showProgress = typeof progress === 'number' && progress > 0 && progress < 1;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
        style={styles.pressable}
      >
        <LinearGradient
          colors={disabled ? ['#9ca3af', '#6b7280'] : colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {showProgress && (
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          )}
          {loading ? (
            <View style={styles.row}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              {showProgress && (
                <Text style={styles.text} numberOfLines={1}>
                  {' '}{Math.round(progress * 100)}%
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.row}>
              {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={styles.icon} />}
              <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 50,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  pressable: { flex: 1 },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 6 },
  text: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.2,
  },
});
