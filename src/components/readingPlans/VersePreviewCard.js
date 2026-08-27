import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';

function VersePreviewCard({ text, reference, bookmarked, onBookmark, onShare }) {
  const theme = useReadingPlanTheme();

  return (
    <LinearGradient
      colors={theme.isDark ? ['#322E24', theme.surface] : ['#FFF8E8', theme.surface]}
      style={[
        styles.card,
        {
          borderColor: theme.accentSoft,
          borderRadius: theme.radius.card,
        },
        theme.shadowSoft,
      ]}
    >
      <View style={[styles.goldLine, { backgroundColor: theme.accent }]} />
      <View style={styles.top}>
        <Text style={[theme.type.caption, { color: theme.accent }]}>TODAY'S VERSE</Text>
        <View style={styles.actions}>
          <Pressable onPress={onBookmark} hitSlop={10} style={styles.iconBtn}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={theme.accent}
            />
          </Pressable>
          <Pressable onPress={onShare} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color={theme.accent} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.verse, { color: theme.textPrimary }]}>"{text}"</Text>
      <Text style={[theme.type.caption, { color: theme.accent, marginTop: 12 }]}>{reference}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },
  goldLine: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 3,
    borderRadius: 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  verse: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});

export default memo(VersePreviewCard);
