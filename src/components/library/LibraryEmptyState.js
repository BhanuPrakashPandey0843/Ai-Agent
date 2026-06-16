import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export default function LibraryEmptyState({
  accent,
  icon = 'folder-open-outline',
  title = 'Nothing here yet',
  message,
}) {
  const { isDark } = useTheme();
  
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
        <Ionicons name={icon} size={36} color={accent} />
      </View>
      <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: textMuted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSizeMD,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
  },
});
