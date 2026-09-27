import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBiblePremiumTheme } from '../../hooks/useBiblePremiumTheme';
import GoldenButton from './GoldenButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DayTimelineCard({ day, status, richContent, onRead, onComplete, onNotes }) {
  const theme = useBiblePremiumTheme();
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

  const borderColor = isToday ? theme.primary : theme.border;
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
              backgroundColor: completed || isToday ? theme.primary : theme.surfaceAlt,
              borderColor: theme.primary,
            },
          ]}
        />
        <View style={[styles.railLine, { backgroundColor: theme.border }]} />
      </View>

      <View
        style={[
          styles.cardShadowWrap,
          { borderRadius: theme.radius, opacity },
          isToday ? theme.shadow : theme.shadowSoft,
        ]}
      >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor,
            borderRadius: theme.radius,
          },
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: isToday || completed ? theme.primary : theme.border }]} />

        <Pressable onPress={toggle} android_ripple={{ color: theme.primarySoft }} style={styles.header}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: completed ? theme.primary : isToday ? theme.primarySoft : theme.surfaceAlt,
              },
            ]}
          >
            {completed ? (
              <Ionicons name="checkmark" size={16} color={theme.onPrimary} />
            ) : locked ? (
              <Ionicons name="lock-closed" size={14} color={theme.textMuted} />
            ) : (
              <Text style={[styles.badgeText, { color: isToday ? theme.primary : theme.text }]}>
                {day.day}
              </Text>
            )}
          </View>

          <View style={styles.headerText}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textFaint, textTransform: 'uppercase', letterSpacing: 0.4 }}>Day {day.day}</Text>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={expanded ? 3 : 1}>
              {day.title}
            </Text>
          </View>

          {isToday ? (
            <View style={[styles.todayChip, { backgroundColor: theme.primary }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.onPrimary }}>Today</Text>
            </View>
          ) : (
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={20} color={theme.textFaint} />
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
            style={[styles.expanded, { borderTopColor: theme.divider }]}
          >
            {day.description ? (
              <Text style={{ fontSize: 13.5, lineHeight: 20, color: theme.textMuted, fontStyle: 'italic' }}>
                {day.description}
              </Text>
            ) : (
              <Text style={{ fontSize: 13.5, lineHeight: 20, color: theme.textMuted }}>{day.scripture}</Text>
            )}

            {richContent && day.devotional ? (
              <Text style={[styles.block, { fontSize: 13.5, lineHeight: 20, color: theme.text }]}>{day.devotional}</Text>
            ) : null}

            <View style={[styles.prayerBox, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary, marginBottom: 8, letterSpacing: 0.4 }}>PRAYER FOCUS</Text>
              <Text style={{ fontSize: 13.5, lineHeight: 20, color: theme.text }}>{prayer}</Text>
            </View>

            <View
              style={[
                styles.reflectBox,
                { backgroundColor: theme.primarySoft, borderLeftColor: theme.primary },
              ]}
            >
              <View style={styles.reflectHead}>
                <Ionicons name="leaf-outline" size={18} color={theme.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary, letterSpacing: 0.4 }}>REFLECTION</Text>
              </View>
              <Text style={{ fontSize: 13.5, lineHeight: 20, color: theme.text, marginTop: 8 }}>{reflection}</Text>
              <Pressable onPress={() => onNotes?.(day)} style={styles.notesCta}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.primary }}>Write a note</Text>
                <Ionicons name="create-outline" size={16} color={theme.primary} />
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
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.text }}>Mark complete</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
      </View>
    </View>
  );
}

function Chip({ icon, label, theme }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: theme.surfaceAlt }]}>
      <Ionicons name={icon} size={14} color={theme.primary} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, flexShrink: 1 }} numberOfLines={1}>
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
  },
  cardShadowWrap: {
    flex: 1,
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
  badgeText: { fontSize: 13, fontWeight: '800' },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', lineHeight: 21, marginTop: 2 },
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
