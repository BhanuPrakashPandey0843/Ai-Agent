// src/screens/DailyPrayerScreen.js
// Premium "Prayer Room" reading experience.
//
// Data mapping (corrected):
//   Daily Prayers     -> approved user-submitted prayers (userPrayers, status == 'approved')
//   Community Prayers -> admin-uploaded prayers (dailyPrayers collection)
//
// Grouping for the Daily date-strip uses `displayDate` (YYYY-MM-DD) when
// present, falling back to `createdAt` for legacy/undated docs.

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
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  subscribeToDailyPrayers,
  subscribeToApprovedUserPrayers,
  subscribeToMyUserPrayers,
  mapUserPrayerToFeedItem,
} from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import { STORAGE_KEYS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getBookmarkIds, toggleBookmarkId } from '../storage';

import SkeletonLoader from '../components/common/SkeletonLoader';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import PrayerDateTimeline, { buildDateRange, groupPrayersByDateKey } from '../components/prayer/PrayerDateTimeline';
import PrayerSearchBar from '../components/prayer/PrayerSearchBar';
import PrayerCard, { PRAYER_CARD_W } from '../components/prayer/PrayerCard';
import MyPrayerStatusCard from '../components/prayer/MyPrayerStatusCard';
import BackHeader from '../components/common/BackHeader';

const CARD_STEP = PRAYER_CARD_W + 20;

// 30 days back, 7 days forward — plenty of room to browse either direction;
// re-generated fresh every mount so "today" is always accurate.
const DATE_RANGE = buildDateRange(30, 30);
const TODAY_KEY = DATE_RANGE.find((d) => d.isToday)?.key;

export default function DailyPrayerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  // ─── Admin-uploaded prayers (dailyPrayers collection) — now powers the
  // "Community" tab. ──────────────────────────────────────────────────────
  const admin = useFirestoreSubscription(
    subscribeToDailyPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_PRAYERS
  );

  // ─── Approved user-submitted prayers (userPrayers, status == 'approved')
  // — now powers the "Daily" tab. ─────────────────────────────────────────
  const community = useFirestoreSubscription(
    subscribeToApprovedUserPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_COMMUNITY_PRAYERS
  );

  const handleAddPrayer = useCallback(() => {
    navigation.navigate('WritePrayer');
  }, [navigation]);

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'community'

  // This user's own submissions — surfaced under the Daily tab (that's the
  // tab that now shows approved userPrayers, so it's where "my submission is
  // still pending/was rejected" status belongs).
  const subscribeMine = useCallback(
    (onData, onError) => subscribeToMyUserPrayers(user?.uid, onData, onError),
    [user?.uid]
  );
  const { items: myPrayers } = useFirestoreSubscription(subscribeMine, null);
  const myPendingOrRejected = useMemo(
    () => myPrayers.filter((p) => p.status === 'pending' || p.status === 'rejected'),
    [myPrayers]
  );

  // ─── Daily Prayers (approved user-submitted prayers) ─────────────────────
  // subscribeToApprovedUserPrayers already filters status == 'approved' and
  // orders by createdAt desc, so this is already "approved only, newest
  // first" with no client-side re-sorting needed.
  const feedItems = useMemo(
    () => (community.items || []).map(mapUserPrayerToFeedItem),
    [community.items]
  );

  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredItems = useMemo(() => {
    let list = feedItems;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (it) =>
          (it.verse || '').toLowerCase().includes(q) ||
          (it.reference || '').toLowerCase().includes(q) ||
          (it.title || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [feedItems, searchQuery]);

  // Bucket prayers by calendar day so the date strip can show a content dot
  // and the screen can render exactly the selected day's prayers.
  const groupsByKey = useMemo(() => groupPrayersByDateKey(filteredItems), [filteredItems]);

  // If the search filter empties out the currently selected day, fall back to
  // today rather than showing a confusing blank state on a date the person
  // didn't actually pick.
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (!groupsByKey[selectedDateKey]?.length && selectedDateKey !== TODAY_KEY) {
      setSelectedDateKey(TODAY_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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

  // ─── Daily tab body (approved user-submitted prayers) ─────────────────────
  let body;
  if (community.loading) {
    body = (
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SkeletonLoader height={54} borderRadius={18} style={{ marginBottom: 16 }} />
        <SkeletonLoader height={52} borderRadius={18} style={{ marginBottom: 20 }} />
        <SkeletonLoader height={380} borderRadius={26} />
      </View>
    );
  } else if (community.error) {
    body = <LibraryErrorState message={community.error} onRetry={community.retry} accent={accent} />;
  } else if (!feedItems.length) {
    body = (
      <LibraryEmptyState
        accent={accent}
        icon="hand-left-outline"
        title="No Prayers Yet"
        message="Prayers submitted by the community will appear here once approved by our team."
      />
    );
  } else {
    body = (
      <>
        {community.fromCache ? (
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

        {myPendingOrRejected.length ? (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <Text style={[styles.myRequestsHeading, { color: colors.textMuted }]}>YOUR SUBMISSIONS</Text>
            {myPendingOrRejected.map((p) => (
              <MyPrayerStatusCard key={p.id} item={p} colors={colors} />
            ))}
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
                  ? 'No approved prayer has been posted for today yet — check back soon.'
                  : 'Nothing was posted on this date. Try another day on the calendar above.'
              }
            />
          </View>
        )}
      </>
    );
  }

  // ─── Community tab body (admin-uploaded prayers) ──────────────────────────
  let communityBody;
  if (admin.loading) {
    communityBody = (
      <View style={{ paddingHorizontal: 20, marginTop: 24, alignItems: 'center' }}>
        <SkeletonLoader height={280} borderRadius={26} style={{ marginBottom: 16, width: PRAYER_CARD_W }} />
        <SkeletonLoader height={280} borderRadius={26} style={{ width: PRAYER_CARD_W }} />
      </View>
    );
  } else if (admin.error) {
    communityBody = <LibraryErrorState message={admin.error} onRetry={admin.retry} accent={accent} />;
  } else if (!admin.items.length) {
    communityBody = (
      <LibraryEmptyState
        accent={accent}
        icon="people-outline"
        title="No Community Prayers Yet"
        message="Prayers shared by our team will appear here."
      />
    );
  } else {
    communityBody = (
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        {admin.fromCache ? (
          <View style={[styles.cacheBanner, { borderColor: accent + '40', backgroundColor: colors.bgCard, alignSelf: 'center' }]}>
            <Ionicons name="cloud-offline-outline" size={13} color={accent} />
            <Text style={[styles.cacheText, { color: accent }]}>Showing saved content</Text>
          </View>
        ) : null}

        <Text style={[styles.dayHeading, { color: colors.textPrimary }]}>Community Prayers</Text>
        <Text style={[styles.communitySubtitle, { color: colors.textMuted }]}>
          Prayers shared with the whole FaithFrames community by our team.
        </Text>

        <View style={{ marginTop: 18, alignItems: 'center' }}>
          {admin.items.map((item) => (
            <View key={item.id} style={{ marginBottom: 20 }}>
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
          ))}
        </View>
      </View>
    );
  }

  const onRefreshActive = activeTab === 'daily' ? community.refresh : admin.refresh;
  const isRefreshingActive = activeTab === 'daily' ? community.refreshing : admin.refreshing;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* subtle premium background glow — never distracts from reading */}
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: accent, top: -80, right: -60 }]} />
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: accent, bottom: 40, left: -80 }]} />

      <BackHeader title="Prayer Room" />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
            activeTab === 'daily' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => setActiveTab('daily')}
          activeOpacity={0.85}
          accessibilityLabel="Daily Prayers tab"
          accessibilityState={{ selected: activeTab === 'daily' }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'daily' ? '#fff' : colors.textSecondary }]}>Daily</Text>
          {myPendingOrRejected.some((p) => p.status === 'rejected') ? (
            <View style={[styles.tabDot, { backgroundColor: activeTab === 'daily' ? '#fff' : '#EF4444' }]} />
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
            activeTab === 'community' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.85}
          accessibilityLabel="Community Prayers tab"
          accessibilityState={{ selected: activeTab === 'community' }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'community' ? '#fff' : colors.textSecondary }]}>Community</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={isRefreshingActive} onRefresh={onRefreshActive} tintColor={accent} colors={[accent]} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'daily' ? body : communityBody}
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
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtnText: { fontSize: 14, fontWeight: '700' },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  communitySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 19,
  },
  myRequestsHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
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
