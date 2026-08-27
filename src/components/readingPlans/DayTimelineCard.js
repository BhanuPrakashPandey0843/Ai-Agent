import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';
import GoldenButton from './GoldenButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DayTimelineCard({ day, status, richContent, onRead, onComplete, onNotes }) {
  const theme = useReadingPlanTheme();
  const [expanded, setExpanded] = useState(false);
  const locked = status === 'locked';
  const isToday = status === 'today';
  const completed = status === 'completed';

  const toggle = () => {
    if (locked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.selectionAsync();
    setExpanded((e) => !e);
  };

  const borderColor = isToday ? theme.accent : theme.border;
  const opacity = locked ? 0.5 : status === 'upcoming' ? 0.78 : 1;

  const prayer = day.prayer || 'Lord, open my heart to receive what You have for me in this passage.';
  const reflection =
    day.reflectionQuestions?.[0] ||
    'What is God inviting you to notice or practice from today\'s reading?';

  return (
    <View style={styles.timelineRow}>
      <View style={styles.rail}>
        <View
          style={[
            styles.railDot,
            {
              backgroundColor: completed || isToday ? theme.accent : theme.surfaceSecondary,
              borderColor: theme.accent,
            },
          ]}
        />
        <View style={[styles.railLine, { backgroundColor: theme.border }]} />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor,
            borderRadius: theme.radius.progress,
            opacity,
          },
          isToday ? theme.shadow : theme.shadowSoft,
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: isToday || completed ? theme.accent : theme.border }]} />

        <Pressable onPress={toggle} android_ripple={{ color: theme.accentSoft }} style={styles.header}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: completed ? theme.accent : isToday ? theme.accentSoft : theme.surfaceSecondary,
              },
            ]}
          >
            {completed ? (
              <Ionicons name="checkmark" size={16} color={theme.onAccent} />
            ) : locked ? (
              <Ionicons name="lock-closed" size={14} color={theme.textSecondary} />
            ) : (
              <Text style={[styles.badgeText, { color: isToday ? theme.accent : theme.textPrimary }]}>
                {day.day}
              </Text>
            )}
          </View>

          <View style={styles.headerText}>
            <Text style={[theme.type.caption, { color: theme.textSecondary }]}>Day {day.day}</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={expanded ? 3 : 1}>
              {day.title}
            </Text>
          </View>

          {isToday ? (
            <View style={[styles.todayChip, { backgroundColor: theme.accent }]}>
              <Text style={[theme.type.caption, { color: theme.onAccent, fontWeight: '600' }]}>Today</Text>
            </View>
          ) : (
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={20} color={theme.textSecondary} />
          )}
        </Pressable>

        <Pressable onPress={toggle}>
          <View style={styles.chipRow}>
            <Chip icon="book-outline" label={day.scripture} theme={theme} />
            <Chip icon="time-outline" label={day.readingTime} theme={theme} />
          </View>
        </Pressable>

        {expanded && !locked ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(160)}
            layout={LinearTransition.duration(220)}
            style={[styles.expanded, { borderTopColor: theme.border }]}
          >
            {day.description ? (
              <Text style={[theme.type.bodySm, { color: theme.textSecondary, fontStyle: 'italic' }]}>
                {day.description}
              </Text>
            ) : (
              <Text style={[theme.type.bodySm, { color: theme.textSecondary }]}>{day.scripture}</Text>
            )}

            {richContent && day.devotional ? (
              <Text style={[theme.type.bodySm, styles.block, { color: theme.textPrimary }]}>{day.devotional}</Text>
            ) : null}

            <View style={[styles.prayerBox, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[theme.type.caption, { color: theme.accent, marginBottom: 8 }]}>PRAYER FOCUS</Text>
              <Text style={[theme.type.bodySm, { color: theme.textPrimary }]}>{prayer}</Text>
            </View>

            <View
              style={[
                styles.reflectBox,
                { backgroundColor: theme.accentSoft, borderLeftColor: theme.accent },
              ]}
            >
              <View style={styles.reflectHead}>
                <Ionicons name="leaf-outline" size={18} color={theme.accent} />
                <Text style={[theme.type.caption, { color: theme.accent }]}>REFLECTION</Text>
              </View>
              <Text style={[theme.type.bodySm, { color: theme.textPrimary, marginTop: 8 }]}>{reflection}</Text>
              <Pressable onPress={() => onNotes?.(day)} style={styles.notesCta}>
                <Text style={[theme.type.caption, { color: theme.accent, fontWeight: '600' }]}>Write a note</Text>
                <Ionicons name="create-outline" size={16} color={theme.accent} />
              </Pressable>
            </View>

            <GoldenButton
              compact
              label={richContent ? "Start Today's Reading" : 'Read Passage'}
              onPress={() => onRead?.(day)}
            />
            {status !== 'completed' ? (
              <Pressable
                onPress={() => onComplete?.(day)}
                style={[styles.doneBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.accent} />
                <Text style={[theme.type.caption, { color: theme.textPrimary }]}>Mark complete</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function Chip({ icon, label, theme }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: theme.surfaceSecondary }]}>
      <Ionicons name={icon} size={14} color={theme.accent} />
      <Text style={[theme.type.caption, { color: theme.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: '70%',
  },
});

const styles = StyleSheet.create({
  timelineRow: { flexDirection: 'row', marginBottom: 12 },
  rail: { width: 20, alignItems: 'center', paddingTop: 22 },
  railDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    zIndex: 1,
  },
  railLine: { flex: 1, width: 1, marginTop: 4, marginBottom: -12 },
  card: {
    flex: 1,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginLeft: 8,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 2 },
  todayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  expanded: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 12,
  },
  block: { marginTop: 4 },
  prayerBox: { borderRadius: 16, padding: 16 },
  reflectBox: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
  },
  reflectHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notesCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
  },
});

export default memo(DayTimelineCard);
