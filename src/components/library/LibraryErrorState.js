import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../theme/colors';
import GradientButton from '../common/GradientButton';

export default function LibraryErrorState({ message, onRetry, accent = Colors.primary }) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={accent} />
      </View>
      <Text style={styles.title}>Unable to load content</Text>
      <Text style={styles.message}>{message || 'Check your connection and try again.'}</Text>
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
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
    marginBottom: Spacing.xxl,
  },
  btn: { width: '100%', maxWidth: 220 },
});
