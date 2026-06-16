import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '../../theme/colors';
import GradientButton from '../common/GradientButton';
import { useTheme } from '../../context/ThemeContext';

export default function LibraryErrorState({ message, onRetry, accent = '#FF6B00' }) {
  const { isDark, colors } = useTheme();
  
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={accent} />
      </View>
      <Text style={[styles.title, { color: textPrimary }]}>Unable to load content</Text>
      <Text style={[styles.message, { color: textMuted }]}>{message || 'Check your connection and try again.'}</Text>
      {onRetry ? (
        <GradientButton title="Retry" onPress={onRetry} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSizeMD,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.xxl,
  },
  btn: { width: '100%', maxWidth: 220 },
});
