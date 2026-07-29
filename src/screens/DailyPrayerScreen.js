// src/screens/DailyPrayerScreen.js
// Premium "Prayer Room" reading experience — Firestore: dailyPrayers.
// Date selection is now a true calendar strip (see PrayerDateTimeline):
// every day is browsable, past and future, regardless of whether a prayer
// exists for it — "today" is resolved fresh on every mount, never hardcoded.
// Same subscribeToDailyPrayers/useFirestoreSubscription data flow, same
// bookmark storage key + toggle logic, same Share/Clipboard share+copy
// behavior as before.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  ScrollView,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subscribeToDailyPrayers } from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getBookmarkIds, toggleBookmarkId } from '../storage';

import SkeletonLoader from '../components/common/SkeletonLoader';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import PrayerDateTimeline, { buildDateRange, groupPrayersByDateKey } from '../components/prayer/PrayerDateTimeline';
import PrayerSearchBar from '../components/prayer/PrayerSearchBar';
import PrayerCategoryChips from '../components/prayer/PrayerCategoryChips';
import PrayerCard, { PRAYER_CARD_W } from '../components/prayer/PrayerCard';
import BackHeader from '../components/common/BackHeader';

const CARD_STEP = PRAYER_CARD_W + 20;

// 30 days back, 7 days forward — plenty of room to browse either direction;
// re-generated fresh every mount so "today" is always accurate.
const DATE_RANGE = buildDateRange(30, 7);
const TODAY_KEY = DATE_RANGE.find((d) => d.isToday)?.key;

export default function DailyPrayerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { showToast } = useToast();

  const { items, loading, error, fromCache, refreshing, refresh, retry } = useFirestoreSubscription(
    subscribeToDailyPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_PRAYERS
  );

  const handleAddPrayer = useCallback(() => {
    navigation.navigate('WritePrayer');
  }, [navigation]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(TODAY_KEY);
  const [bookmarked, setBookmarked] = useState({});

  const accent = colors.primary;

  useEffect(() => {
    getBookmarkIds(STORAGE_KEYS.PRAYER_BOOKMARKS).then((ids) => {
      const map = {};
      ids.forEach((id) => {
        map[id] = true;
      });
      setBookmarked(map);
    });
  }, []);

  // Only built from real data — categories are hidden entirely if the
  // admin never set a `category` field on any prayer document.
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedCategory) {
      list = list.filter((it) => it.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (it) => (it.verse || '').toLowerCase().includes(q) || (it.reference || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, selectedCategory, searchQuery]);

  // Bucket prayers by calendar day so the date strip can show a content dot
  // and the screen can render exactly the selected day's prayers.
  const groupsByKey = useMemo(() => groupPrayersByDateKey(filteredItems), [filteredItems]);

  // If a search/category filter empties out the currently selected day,
  // fall back to today rather than showing a confusing blank state on a
  // date the person didn't actually pick.
  useEffect(() => {
    if (!searchQuery.trim() && !selectedCategory) return;
    if (!groupsByKey[selectedDateKey]?.length && selectedDateKey !== TODAY_KEY) {
      setSelectedDateKey(TODAY_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory]);

  const dayItems = groupsByKey[selectedDateKey] || [];

  const handleSelectDate = useCallback((key) => {
    setSelectedDateKey(key);
  }, []);

  const handleBookmark = useCallback(async (id) => {
    const next = await toggleBookmarkId(STORAGE_KEYS.PRAYER_BOOKMARKS, id);
    const map = {};
    next.forEach((bid) => {
      map[bid] = true;
    });
    setBookmarked(map);
  }, []);

  const shareMessage = useCallback((item) => `${item.verse}\n— ${item.reference}\n\nShared via Faith Frames`, []);

  const handleShare = useCallback(
    async (item) => {
      try {
        await Share.share({ message: shareMessage(item) });
      } catch {
        // user cancelled — no-op
      }
    },
    [shareMessage]
  );

  const handleCopy = useCallback(
    async (item) => {
      try {
        await Clipboard.setStringAsync(shareMessage(item));
        showToast('Copied to clipboard', 'success', 2000);
      } catch {
        showToast('Could not copy text', 'error');
      }
    },
    [shareMessage, showToast]
  );

  const renderCard = useCallback(
    ({ item }) => (
      <View style={{ width: PRAYER_CARD_W, marginRight: 20 }}>
        <PrayerCard
          item={item}
          colors={colors}
          accent={accent}
          isBookmarked={!!bookmarked[item.id]}
          onBookmark={() => handleBookmark(item.id)}
          onShare={() => handleShare(item)}
          onCopy={() => handleCopy(item)}
        />
      </View>
    ),
    [colors, accent, bookmarked, handleBookmark, handleShare, handleCopy]
  );

  const selectedDateLabel = useMemo(() => {
    const entry = DATE_RANGE.find((d) => d.key === selectedDateKey);
    if (!entry) return '';
    if (entry.isToday) return 'Today';
    return `${entry.dayLabel}, ${entry.monthLabel} ${entry.dateLabel}`;
  }, [selectedDateKey]);

  let body;
  if (loading) {
    body = (
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SkeletonLoader height={54} borderRadius={18} style={{ marginBottom: 16 }} />
        <SkeletonLoader height={52} borderRadius={18} style={{ marginBottom: 20 }} />
        <SkeletonLoader height={380} borderRadius={26} />
      </View>
    );
  } else if (error) {
    body = <LibraryErrorState message={error} onRetry={retry} accent={accent} />;
  } else if (!items.length) {
    body = (
      <LibraryEmptyState
        accent={accent}
        icon="hand-left-outline"
        title="No Prayers Yet"
        message="Daily prayers will appear here once added by the admin."
      />
    );
  } else {
    body = (
      <>
        {fromCache ? (
          <View style={[styles.cacheBanner, { borderColor: accent + '40', backgroundColor: colors.bgCard }]}>
            <Ionicons name="cloud-offline-outline" size={13} color={accent} />
            <Text style={[styles.cacheText, { color: accent }]}>Showing saved content</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 20, marginBottom: 18 }}>
          <PrayerDateTimeline
            dates={DATE_RANGE}
            selectedKey={selectedDateKey}
            onSelect={handleSelectDate}
            colors={colors}
            accent={accent}
            countsByKey={groupsByKey}
          />
        </View>

        <PrayerSearchBar value={searchQuery} onChangeText={setSearchQuery} colors={colors} accent={accent} onAddPress={handleAddPrayer} />

        {categories.length ? (
          <View style={{ marginTop: 18 }}>
            <PrayerCategoryChips
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              colors={colors}
              accent={accent}
            />
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20, marginTop: 22, marginBottom: 4 }}>
          <Text style={[styles.dayHeading, { color: colors.textPrimary }]}>{selectedDateLabel}</Text>
        </View>

        {dayItems.length ? (
          <>
            <FlatList
              data={dayItems}
              keyExtractor={(it) => it.id}
              horizontal
              snapToInterval={CARD_STEP}
              decelerationRate="fast"
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
              renderItem={renderCard}
              getItemLayout={(_, index) => ({ length: CARD_STEP, offset: CARD_STEP * index, index })}
            />

            {dayItems.length > 1 ? (
              <View style={[styles.pageChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Text style={[styles.pageChipText, { color: colors.textMuted }]}>
                  {dayItems.length} prayer{dayItems.length === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <LibraryEmptyState
              accent={accent}
              icon="calendar-outline"
              title="No Prayers This Day"
              message={
                selectedDateKey === TODAY_KEY
                  ? 'No prayer has been posted for today yet — check back soon.'
                  : 'Nothing was posted on this date. Try another day on the calendar above.'
              }
            />
          </View>
        )}
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* subtle premium background glow — never distracts from reading */}
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: accent, top: -80, right: -60 }]} />
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: accent, bottom: 40, left: -80 }]} />

      <BackHeader title="Prayer Room" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accent} colors={[accent]} />}
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.06,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  cacheText: { fontSize: 11, fontWeight: '600' },
  dayHeading: { fontSize: 16, fontWeight: '800' },
  pageChip: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  pageChipText: { fontSize: 12, fontWeight: '700' },
});
