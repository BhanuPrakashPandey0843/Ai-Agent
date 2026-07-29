// src/components/prayer/PrayerDateTimeline.js
// Horizontal date-strip selector for the Prayer Room screen.
// Unlike a "pill per day that has content", this generates a continuous,
// always-dynamic range of calendar days (past + future) centered on
// *today* — computed fresh on every mount, so it never goes stale and
// never needs a manual date update. Selecting any day (with or without
// prayers) is supported; the screen decides what to render for that day.
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toDateSafe(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** "2026-07-27" style key for a JS Date, in local time. */
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Build a continuous date strip: `daysBack` days into the past through
 * `daysForward` days into the future, always including today. "Today" is
 * resolved fresh on every call (no fixed/hardcoded date), so the strip —
 * and which pill is "Today" — updates automatically whenever this runs.
 */
export function buildDateRange(daysBack = 30, daysForward = 7) {
  const today = startOfDay(new Date());
  const dates = [];
  for (let i = -daysBack; i <= daysForward; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push({
      key: dateKey(d),
      date: d,
      isToday: i === 0,
      dayLabel: WEEKDAYS[d.getDay()],
      dateLabel: `${d.getDate()}`,
      monthLabel: MONTHS[d.getMonth()],
    });
  }
  return dates;
}

/** Bucket prayers by the calendar day (local time) their createdAt falls on. */
export function groupPrayersByDateKey(items) {
  const map = {};
  items.forEach((item) => {
    const date = toDateSafe(item.createdAt);
    const key = date ? dateKey(date) : 'undated';
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

const PILL_W = 60;
const PILL_GAP = 10;
const PILL_STEP = PILL_W + PILL_GAP;

export default function PrayerDateTimeline({ dates, selectedKey, onSelect, colors, accent, countsByKey }) {
  const listRef = useRef(null);

  const selectedIndex = useMemo(
    () => Math.max(0, dates.findIndex((d) => d.key === selectedKey)),
    [dates, selectedKey]
  );

  useEffect(() => {
    if (!listRef.current || !dates.length) return;
    try {
      listRef.current.scrollToIndex({ index: selectedIndex, animated: true, viewPosition: 0.5 });
    } catch {
      // ignore — list may not be laid out yet
    }
  }, [selectedIndex, dates.length]);

  const renderItem = useCallback(
    ({ item }) => {
      const isActive = item.key === selectedKey;
      const hasContent = (countsByKey?.[item.key] || 0) > 0;
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSelect(item.key)}
          style={[
            styles.pill,
            {
              backgroundColor: isActive ? accent : item.isToday ? accent + '18' : colors.bgCard,
              borderColor: isActive ? accent : item.isToday ? accent : colors.border,
            },
          ]}
        >
          <Text style={[styles.dayLabel, { color: isActive ? '#FFFFFF' : colors.textMuted }]} allowFontScaling={false}>
            {item.isToday ? 'Today' : item.dayLabel}
          </Text>
          <Text
            style={[
              styles.dateLabel,
              { color: isActive ? '#FFFFFF' : item.isToday ? accent : colors.textPrimary },
            ]}
            allowFontScaling={false}
          >
            {item.dateLabel}
          </Text>
          <Text style={[styles.monthLabel, { color: isActive ? '#FFFFFF' : colors.textMuted }]} allowFontScaling={false}>
            {item.monthLabel}
          </Text>
          {hasContent ? <View style={[styles.dot, { backgroundColor: isActive ? '#FFFFFF' : accent }]} /> : null}
        </TouchableOpacity>
      );
    },
    [selectedKey, accent, colors, onSelect, countsByKey]
  );

  if (!dates.length) return null;

  return (
    <FlatList
      ref={listRef}
      data={dates}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(d) => d.key}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      getItemLayout={(_, index) => ({ length: PILL_STEP, offset: PILL_STEP * index, index })}
      initialScrollIndex={selectedIndex}
      onScrollToIndexFailed={({ index }) => {
        // Estimated offsets can be slightly off before layout settles.
        setTimeout(() => {
          try {
            listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
          } catch {
            // ignore
          }
        }, 250);
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  pill: {
    width: PILL_W,
    height: 74,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: PILL_GAP,
    paddingVertical: 8,
  },
  dayLabel: { fontSize: 11, fontWeight: '700' },
  dateLabel: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  monthLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  dot: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
