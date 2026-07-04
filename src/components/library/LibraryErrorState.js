import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '../../theme/colors';
import GradientButton from '../common/GradientButton';
import { useTheme } from '../../context/ThemeContext';

export default function LibraryErrorState({ message, onRetry, accent }) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: (accent || colors.primary) + '15' }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={accent || colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Unable to load content</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message || 'Check your connection and try again.'}</Text>
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
