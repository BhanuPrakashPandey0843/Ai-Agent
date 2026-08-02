import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';

export default function QuizTypeCard({ quizType, onPress }) {
  const { colors, isDark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8, tension: 120 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 100 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.bgCard }, cardShadow(isDark)]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.92}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${quizType.color}22`, borderColor: `${quizType.color}3D` }]}>
          <MaterialCommunityIcons name={quizType.icon} size={32} color={quizType.color} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{quizType.label}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={2}>
            {quizType.subtitle}
          </Text>
        </View>
        <View style={[styles.chevronWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardShadow = (isDark) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: isDark ? 0.4 : 0.08,
  shadowRadius: 12,
  elevation: 8,
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    minHeight: 92,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: { flex: 1 },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightExtraBold,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  sub: {
    fontSize: Typography.fontSizeSM,
    lineHeight: Typography.lineHeightSM,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
