import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBiblePremiumTheme } from '../../hooks/useBiblePremiumTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WeekAccordion({ weeks, currentDay, renderDay, defaultOpenWeek }) {
  const theme = useBiblePremiumTheme();
  const [openWeek, setOpenWeek] = useState(defaultOpenWeek ?? null);

  const toggle = (week) => {
    Haptics.selectionAsync();
    setOpenWeek((prev) => (prev === week ? null : week));
  };

  return (
    <View>
      {weeks.map(({ week, days }) => {
        const isOpen = openWeek === week;
        const containsToday = days.some((d) => d.day === currentDay);
        const allDone = days.every((d) => d.day < currentDay);
        const doneCount = days.filter((d) => d.day < currentDay).length;

        return (
          <View
            key={week}
            style={[
              styles.weekWrap,
              {
                borderColor: containsToday ? theme.primary : theme.border,
                backgroundColor: theme.surface,
                borderRadius: theme.radius,
              },
              theme.shadowSoft,
            ]}
          >
            <Pressable
              onPress={() => toggle(week)}
              style={({ pressed }) => [styles.weekHeader, { opacity: pressed ? 0.88 : 1 }]}
            >
              <View
                style={[
                  styles.weekDot,
                  { backgroundColor: allDone || containsToday ? theme.primarySoft : theme.surfaceAlt },
                ]}
              >
                {allDone ? (
                  <Ionicons name="checkmark" size={16} color={theme.primary} />
                ) : (
                  <Ionicons name="calendar-outline" size={16} color={containsToday ? theme.primary : theme.textMuted} />
                )}
              </View>
              <View style={styles.weekCopy}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>
                  Week {week}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginTop: 2 }}>
                  {doneCount}/{days.length} days
                </Text>
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.textFaint}
              />
            </Pressable>

            {isOpen ? (
              <Animated.View
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(160)}
                layout={LinearTransition}
                style={styles.daysWrap}
              >
                {days.map((day) => renderDay(day))}
              </Animated.View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  weekWrap: {
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCopy: { flex: 1 },
  daysWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
