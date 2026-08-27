import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';

function SectionHeader({ title, subtitle }) {
  const theme = useReadingPlanTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[theme.type.section, { color: theme.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[theme.type.caption, styles.sub, { color: theme.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, marginTop: 8 },
  sub: { marginTop: 4 },
});

export default memo(SectionHeader);
