// src/screens/DailyPrayerScreen.js
// Premium "Prayer Room" reading experience — Firestore: dailyPrayers plus
// approved userPrayers mapped onto the same card feed. Grouping uses
// `displayDate` (YYYY-MM-DD), falling back to createdAt only for legacy docs.

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
  togglePrayingForRequest,
  getMyPrayingState,
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
import PrayerCategoryChips from '../components/prayer/PrayerCategoryChips';
import PrayerCard, { PRAYER_CARD_W } from '../components/prayer/PrayerCard';
import CommunityPrayerCard from '../components/prayer/CommunityPrayerCard';
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

  const { items, loading, error, fromCache, refreshing, refresh, retry } = useFirestoreSubscription(
    subscribeToDailyPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_PRAYERS
  );

  const handleAddPrayer = useCallback(() => {
    navigation.navigate('WritePrayer');
  }, [navigation]);

  // ─── Community Prayer Requests (approved userPrayers) ────────────────────
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'community'

  const community = useFirestoreSubscription(
    subscribeToApprovedUserPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_COMMUNITY_PRAYERS
  );

  const subscribeMine = useCallback(
    (onData, onError) => subscribeToMyUserPrayers(user?.uid, onData, onError),
    [user?.uid]
  );
  const { items: myPrayers } = useFirestoreSubscription(subscribeMine, null);
  // Only pending/rejected need surfacing here — approved ones already show
  // up as regular cards in the community feed below.
  const myPendingOrRejected = useMemo(
    () => myPrayers.filter((p) => p.status === 'pending' || p.status === 'rejected'),
    [myPrayers]
  );

  const [prayingMap, setPrayingMap] = useState({});
  const [prayBusyId, setPrayBusyId] = useState(null);

  useEffect(() => {
    if (activeTab !== 'community' || !user?.uid || !community.items.length) return;
    let cancelled = false;
    Promise.all(
      community.items.map((it) => getMyPrayingState(it.id, user.uid).then((val) => [it.id, val]))
    ).then((entries) => {
      if (cancelled) return;
      setPrayingMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.uid, community.items]);

  const handleTogglePray = useCallback(
    async (item) => {
      if (!user?.uid) {
        showToast('Please sign in to pray for this request.', 'error');
        return;
      }
      if (prayBusyId) return;
      setPrayBusyId(item.id);
      const prevPraying = !!prayingMap[item.id];
      setPrayingMap((prev) => ({ ...prev, [item.id]: !prevPraying }));
      try {
        const next = await togglePrayingForRequest(item.id, user.uid);
        setPrayingMap((prev) => ({ ...prev, [item.id]: next }));
      } catch (err) {
        setPrayingMap((prev) => ({ ...prev, [item.id]: prevPraying }));
        showToast(err?.message || 'Could not update right now.', 'error');
      } finally {
        setPrayBusyId(null);
      }
    },
    [user?.uid, prayingMap, prayBusyId, showToast]
  );

  const openCommunityDetail = useCallback(
    (item) => navigation.navigate('CommunityPrayerDetail', { item }),
    [navigation]
  );

  const feedItems = useMemo(() => {
    const approvedAsCards = (community.items || []).map(mapUserPrayerToFeedItem);
    const seen = new Set();
    const merged = [];
    [...items, ...approvedAsCards].forEach((it) => {
      if (!it?.id || seen.has(it.id)) return;
      seen.add(it.id);
      merged.push(it);
    });
    return merged;
  }, [items, community.items]);

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
    community.items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [items, community.items]);

  const filteredItems = useMemo(() => {
    let list = feedItems;
    if (selectedCategory) {
      list = list.filter((it) => it.category === selectedCategory);
    }
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
  }, [feedItems, selectedCategory, searchQuery]);

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
  } else if (!feedItems.length) {
    body = (
      <LibraryEmptyState
        accent={accent}
        icon="hand-left-outline"
        title="No Prayers Yet"
        message="Daily prayers will appear here once added or approved for a display date."
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

  let communityBody;
  if (community.loading) {
    communityBody = (
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SkeletonLoader height={140} borderRadius={22} style={{ marginBottom: 16 }} />
        <SkeletonLoader height={140} borderRadius={22} />
      </View>
    );
  } else if (community.error) {
    communityBody = <LibraryErrorState message={community.error} onRetry={community.retry} accent={accent} />;
  } else {
    communityBody = (
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        {community.fromCache ? (
          <View style={[styles.cacheBanner, { borderColor: accent + '40', backgroundColor: colors.bgCard, alignSelf: 'center' }]}>
            <Ionicons name="cloud-offline-outline" size={13} color={accent} />
            <Text style={[styles.cacheText, { color: accent }]}>Showing saved content</Text>
          </View>
        ) : null}

        <View style={styles.communityHeaderRow}>
          <Text style={[styles.dayHeading, { color: colors.textPrimary }]}>Community Prayer Requests</Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: accent }]}
            onPress={handleAddPrayer}
            activeOpacity={0.85}
            accessibilityLabel="Share a prayer request"
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.communitySubtitle, { color: colors.textMuted }]}>
          Requests approved by our team. Tap to read, pray, and leave encouragement.
        </Text>

        {myPendingOrRejected.length ? (
          <View style={{ marginTop: 18, marginBottom: 4 }}>
            <Text style={[styles.myRequestsHeading, { color: colors.textMuted }]}>YOUR SUBMISSIONS</Text>
            {myPendingOrRejected.map((p) => (
              <MyPrayerStatusCard key={p.id} item={p} colors={colors} />
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          {community.items.length ? (
            community.items.map((it) => (
              <CommunityPrayerCard
                key={it.id}
                item={it}
                colors={colors}
                accent={accent}
                isPraying={!!prayingMap[it.id]}
                prayBusy={prayBusyId === it.id}
                onPress={() => openCommunityDetail(it)}
                onPray={() => handleTogglePray(it)}
              />
            ))
          ) : (
            <LibraryEmptyState
              accent={accent}
              icon="people-outline"
              title="No Community Requests Yet"
              message="Approved prayer requests from the community will appear here."
            />
          )}
        </View>
      </View>
    );
  }

  const onRefreshActive = activeTab === 'daily' ? refresh : community.refresh;
  const isRefreshingActive = activeTab === 'daily' ? refreshing : community.refreshing;

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
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
            activeTab === 'community' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.85}
          accessibilityLabel="Community Prayer Requests tab"
          accessibilityState={{ selected: activeTab === 'community' }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'community' ? '#fff' : colors.textSecondary }]}>Community</Text>
          {myPendingOrRejected.some((p) => p.status === 'rejected') ? (
            <View style={[styles.tabDot, { backgroundColor: activeTab === 'community' ? '#fff' : '#EF4444' }]} />
          ) : null}
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
  communityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  shareBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
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
