import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';

function StatsCard({ icon, label, value }) {
  const theme = useReadingPlanTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: theme.radius.progress,
        },
        theme.shadowSoft,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={20} color={theme.accent} />
      </View>
      <Text style={[theme.type.section, { color: theme.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[theme.type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(StatsCard);
