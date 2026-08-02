import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';

export default function QuizOptionButton({
  label,
  letter,
  state = 'default',
  disabled,
  onPress,
}) {
  const { colors, isDark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'correct' || state === 'wrong') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.03, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [state, scale]);

  const containerStyle = [styles.option, { backgroundColor: colors.bgCard, borderColor: isDark ? '#2A2A44' : '#EDE8DC' }];
  if (state === 'correct') containerStyle.push({ borderColor: colors.success, backgroundColor: isDark ? '#1B3B1F' : '#E8F5E9' });
  if (state === 'wrong') containerStyle.push({ borderColor: colors.error, backgroundColor: isDark ? '#3B1B1B' : '#FFEBEE' });
  if (state === 'selected') containerStyle.push({ borderColor: colors.primary, backgroundColor: isDark ? '#2A2A44' : '#E8EFFF' });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled}>
      <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
        <Text style={[styles.letter, { backgroundColor: colors.primary }]}>{letter}</Text>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {state === 'correct' ? (
          <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
        ) : null}
        {state === 'wrong' ? (
          <MaterialCommunityIcons name="close-circle" size={22} color={colors.error} />
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  letter: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.round,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: Typography.fontWeightBold,
    fontSize: Typography.fontSizeSM,
    overflow: 'hidden',
  },
  label: {
    flex: 1,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightMedium,
    lineHeight: Typography.lineHeightMD,
  },
});
