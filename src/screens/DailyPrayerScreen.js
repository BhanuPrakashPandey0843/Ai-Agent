// src/screens/DailyPrayerScreen.js
// Prayer Room.
//
// Data mapping:
//   Daily     -> admin-uploaded daily prayers + the signed-in user's private prayers
//   Community -> approved user-submitted prayer requests
//
// Daily groups by `displayDate` (YYYY-MM-DD, local calendar day) when present and
// falls back to `createdAt` for legacy/undated docs. Everything below the search
// bar is rendered as compact PrayerRoomCards inside one virtualized list; the
// header (toggle), date strip, search + add button keep their original look.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  Share,
  Platform,
  AppState,
  Animated,
  Easing,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  subscribeToDailyPrayers,
  subscribeToApprovedUserPrayers,
  subscribeToMyUserPrayers,
  deleteMyUserPrayer,
} from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';
import usePrayingStates from '../hooks/usePrayingStates';
import { STORAGE_KEYS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getBookmarkIds, toggleBookmarkId, subscribeToStoredList } from '../storage';
import {
  toRoomItem,
  toAdminItem,
  sortNewest,
  matchesQuery,
  getTodayKey,
  shiftDateKey,
  formatDateKey,
  withTimeout,
  describePrayerError,
} from '../utils/prayerRoom';

import SkeletonLoader from '../components/common/SkeletonLoader';
import BackHeader from '../components/common/BackHeader';
import LibraryErrorState from '../components/library/LibraryErrorState';
import PrayerDateTimeline, {
  buildDateRange,
  groupPrayersByDateKey,
  prayerDisplayDateKey,
} from '../components/prayer/PrayerDateTimeline';
import PrayerSearchBar from '../components/prayer/PrayerSearchBar';
import PrayerFilterChips from '../components/prayer/PrayerFilterChips';
import PrayerRoomCard from '../components/prayer/PrayerRoomCard';
import PrayerSectionHeader from '../components/prayer/PrayerSectionHeader';
import PrayerEmptyState from '../components/prayer/PrayerEmptyState';
import MyPrayerStatusCard from '../components/prayer/MyPrayerStatusCard';
import PrayerComposerSheet from '../components/prayer/PrayerComposerSheet';
import PrayerActionSheet from '../components/prayer/PrayerActionSheet';

const DAYS_BACK = 30;
const DAYS_FORWARD = 30;
const MAX_CONTENT_WIDTH = 880; // keeps the layout readable on tablets / desktop web
const WIDE_BREAKPOINT = 840; // two-column cards from here up
const PAGE_PAD = 20;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DELETE_TIMEOUT_MS = 15000;

/** Local "today" key that rolls over at midnight and when the app returns to the foreground. */
function useTodayKey() {
  const [todayKey, setTodayKey] = useState(getTodayKey);
  useEffect(() => {
    let timer = null;
    const sync = () => {
      const next = getTodayKey();
      setTodayKey((cur) => (cur === next ? cur : next));
    };
    const schedule = () => {
      const now = new Date();
      // Date() normalises month / year overflow, so Dec 31 -> Jan 1 just works.
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        sync();
        schedule();
      }, Math.min(nextMidnight.getTime() - now.getTime(), 2147483000));
    };
    schedule();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub?.remove?.();
    };
  }, []);
  return todayKey;
}

/** Text used for both Share and Copy. */
function buildPrayerText(item) {
  const body = String(item?.verse || item?.description || '').trim();
  const footer = '\n\nShared via Faith Frames';
  if (item?.kind === 'admin') {
    const ref = String(item?.reference || '').trim();
    return `${body}${ref ? `\n— ${ref}` : ''}${footer}`;
  }
  const title = String(item?.title || '').trim();
  return `${title ? `${title}\n\n` : ''}${body}${footer}`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function describeDeleteError(err) {
  const code = err?.code || '';
  if (code === 'permission-denied') return 'You can only delete your own prayers.';
  if (['app/timeout', 'unavailable', 'deadline-exceeded', 'auth/network-request-failed'].includes(code)) {
    return describePrayerError(err);
  }
  return 'Could not delete this prayer. Please try again.';
}

export default function DailyPrayerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const uid = user?.uid || null;
  const accent = colors.primary;
  const wide = width >= WIDE_BREAKPOINT;

  // ─── Data ────────────────────────────────────────────────────────────────
  // Admin-uploaded prayers (dailyPrayers) -> Daily tab.
  const admin = useFirestoreSubscription(subscribeToDailyPrayers, STORAGE_KEYS.LIBRARY_CACHE_PRAYERS);
  // Approved user-submitted prayers -> Community tab.
  const community = useFirestoreSubscription(
    subscribeToApprovedUserPrayers,
    STORAGE_KEYS.LIBRARY_CACHE_COMMUNITY_PRAYERS
  );
  // This user's own prayers (personal + community submissions, any status).
  const subscribeMine = useCallback(
    (onData, onError) => subscribeToMyUserPrayers(uid, onData, onError),
    [uid]
  );
  const mine = useFirestoreSubscription(subscribeMine, null);

  const { refresh: refreshAdmin } = admin;
  const { refresh: refreshCommunity } = community;
  const { refresh: refreshMine, retry: retryMine } = mine;

  // ─── UI state ────────────────────────────────────────────────────────────
  const todayKey = useTodayKey();
  const dates = useMemo(() => buildDateRange(DAYS_BACK, DAYS_FORWARD), [todayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const prevTodayRef = useRef(todayKey);
  useEffect(() => {
    if (prevTodayRef.current === todayKey) return;
    const previous = prevTodayRef.current;
    prevTodayRef.current = todayKey;
    // Someone left on "today" past midnight should land on the new today.
    setSelectedDateKey((sel) => (sel === previous ? todayKey : sel));
  }, [todayKey]);

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'community'
  const [filter, setFilter] = useState('all'); // all | personal | community | saved
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const lowerQuery = query.toLowerCase();

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 180);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSearchChange = useCallback((text) => {
    setSearchInput(text);
    if (!text.trim()) setQuery(''); // clearing should feel instant
  }, []);

  const tabAnim = useRef(new Animated.Value(1)).current;
  const switchTab = useCallback(
    (next) => {
      if (next === activeTab) return;
      tabAnim.setValue(0);
      setActiveTab(next);
      setFilter('all');
      Animated.timing(tabAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [activeTab, tabAnim]
  );

  const handleSelectDate = useCallback((key) => {
    setSelectedDateKey(key);
    // Picking a day means "show me that day": leave search / saved views.
    setSearchInput('');
    setQuery('');
    setFilter((f) => (f === 'saved' ? 'all' : f));
  }, []);

  // ─── Saved prayers (local bookmarks, same storage as before) ──────────────
  const [bookmarked, setBookmarked] = useState({});
  const bookmarkedRef = useRef(bookmarked);
  bookmarkedRef.current = bookmarked;
  const bookmarkQueue = useRef(Promise.resolve());

  useEffect(() => {
    let alive = true;
    const apply = (ids) => {
      if (!alive) return;
      const map = {};
      (Array.isArray(ids) ? ids : []).forEach((id) => {
        map[id] = true;
      });
      setBookmarked(map);
    };
    getBookmarkIds(STORAGE_KEYS.PRAYER_BOOKMARKS).then(apply);
    const unsubscribe = subscribeToStoredList(STORAGE_KEYS.PRAYER_BOOKMARKS, apply);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const handleBookmark = useCallback((item) => {
    const id = item?.id;
    if (!id) return;
    // Optimistic flip; the stored-list subscription then confirms the real state.
    setBookmarked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
    // Serialised so rapid taps can never read the same stored list twice.
    bookmarkQueue.current = bookmarkQueue.current
      .then(() => toggleBookmarkId(STORAGE_KEYS.PRAYER_BOOKMARKS, id))
      .catch(() => {});
  }, []);

  // ─── Share / copy ────────────────────────────────────────────────────────
  const handleShare = useCallback(
    async (item) => {
      const message = buildPrayerText(item);
      try {
        await Share.share({ message });
      } catch {
        if (Platform.OS === 'web') {
          // No native share sheet in this browser: copy instead so the action still works.
          try {
            await Clipboard.setStringAsync(message);
            showToast('Sharing is not available here, so the prayer was copied instead.', 'info', 2800);
          } catch {
            showToast('Could not share this prayer.', 'error');
          }
          return;
        }
        showToast('Could not open sharing. Please try again.', 'error');
      }
    },
    [showToast]
  );

  const handleCopy = useCallback(
    async (item) => {
      try {
        await Clipboard.setStringAsync(buildPrayerText(item));
        showToast('Prayer copied to clipboard', 'success', 1800);
        return true;
      } catch {
        showToast('Could not copy this prayer.', 'error');
        return false;
      }
    },
    [showToast]
  );

  // ─── Items ───────────────────────────────────────────────────────────────
  const approvedItems = useMemo(
    () => (community.items || []).map((raw) => toRoomItem(raw, uid)),
    [community.items, uid]
  );
  const personalItems = useMemo(
    () => (mine.items || []).filter((raw) => raw?.category === 'personal').map((raw) => toRoomItem(raw, uid)),
    [mine.items, uid]
  );
  const adminItems = useMemo(() => (admin.items || []).map(toAdminItem).sort(sortNewest), [admin.items]);
  const dailyItems = useMemo(() => [...adminItems, ...personalItems].sort(sortNewest), [adminItems, personalItems]);
  const communityItems = useMemo(() => [...approvedItems].sort(sortNewest), [approvedItems]);

  // Own community submissions that still need attention (approved ones are already in the list).
  const submissions = useMemo(
    () =>
      (mine.items || []).filter(
        (raw) => raw?.category !== 'personal' && (raw?.status === 'pending' || raw?.status === 'rejected')
      ),
    [mine.items]
  );

  const baseItems = activeTab === 'daily' ? dailyItems : communityItems;

  const counts = useMemo(() => {
    let personal = 0;
    let saved = 0;
    baseItems.forEach((it) => {
      if (it.kind === 'personal') personal += 1;
      if (bookmarked[it.id]) saved += 1;
    });
    return { personal, saved };
  }, [baseItems, bookmarked]);

  // Search and filter always apply together.
  const filtered = useMemo(
    () =>
      baseItems.filter((it) => {
        if (filter === 'saved' && !bookmarked[it.id]) return false;
        if ((filter === 'personal' || filter === 'community') && it.kind !== filter) return false;
        return matchesQuery(it, lowerQuery);
      }),
    [baseItems, filter, bookmarked, lowerQuery]
  );

  const groupsByKey = useMemo(
    () => (activeTab === 'daily' ? groupPrayersByDateKey(filtered) : {}),
    [activeTab, filtered]
  );

  const selectedDateLabel = useMemo(() => {
    if (selectedDateKey === todayKey) return 'Today';
    if (selectedDateKey === shiftDateKey(todayKey, -1)) return 'Yesterday';
    if (selectedDateKey === shiftDateKey(todayKey, 1)) return 'Tomorrow';
    return formatDateKey(selectedDateKey, true);
  }, [selectedDateKey, todayKey]);

  // ─── Composer / owner actions ────────────────────────────────────────────
  const [composer, setComposer] = useState({
    visible: false,
    mode: 'create',
    initial: null,
    defaultCategory: 'community',
    defaultDateKey: undefined,
  });
  const [sheet, setSheet] = useState(null); // { item, step: 'menu' | 'confirm' }
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

  const openCreate = useCallback(() => {
    if (!uid) {
      showToast('Please sign in to add a prayer.', 'error');
      return;
    }
    setComposer({
      visible: true,
      mode: 'create',
      initial: null,
      defaultCategory: activeTab === 'daily' ? 'personal' : 'community',
      defaultDateKey: selectedDateKey,
    });
  }, [uid, showToast, activeTab, selectedDateKey]);

  const closeComposer = useCallback(() => setComposer((c) => ({ ...c, visible: false })), []);

  const openEdit = useCallback((item) => {
    const personal = item.kind === 'personal';
    setSheet(null);
    setComposer({
      visible: true,
      mode: 'edit',
      initial: {
        sourceId: item.sourceId,
        category: personal ? 'personal' : 'community',
        title: item.title || '',
        description: item.description || '',
        content: item.content || item.verse || '',
        anonymous: item.anonymous === true,
        displayDate: personal && typeof item.displayDate === 'string' ? item.displayDate : undefined,
      },
      defaultCategory: personal ? 'personal' : 'community',
      defaultDateKey: undefined,
    });
  }, []);

  const handleSaved = useCallback(
    ({ mode, category, displayDate }) => {
      setComposer((c) => ({ ...c, visible: false }));
      if (mode !== 'create') return;
      // Take the person to where the new prayer lives.
      const nextTab = category === 'personal' ? 'daily' : 'community';
      if (nextTab !== activeTab) {
        tabAnim.setValue(0);
        setActiveTab(nextTab);
        Animated.timing(tabAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
      setFilter('all');
      setSearchInput('');
      setQuery('');
      if (category === 'personal' && displayDate && dates.some((d) => d.key === displayDate)) {
        setSelectedDateKey(displayDate);
      }
    },
    [activeTab, dates, tabAnim]
  );

  const openMenu = useCallback((item) => setSheet({ item, step: 'menu' }), []);
  const closeSheet = useCallback(() => {
    if (deletingRef.current) return;
    setSheet(null);
  }, []);
  const askDelete = useCallback((item) => setSheet({ item, step: 'confirm' }), []);

  const confirmDelete = useCallback(
    async (item) => {
      if (deletingRef.current) return; // blocks double taps
      deletingRef.current = true;
      setDeleting(true);
      try {
        await withTimeout(deleteMyUserPrayer(item.sourceId, uid), DELETE_TIMEOUT_MS);
        if (bookmarkedRef.current[item.id]) handleBookmark(item); // drop the stale saved entry
        setSheet(null);
        showToast('Prayer deleted', 'success', 1800);
      } catch (err) {
        console.error('[PrayerRoom] delete failed:', err?.code, err?.message);
        showToast(describeDeleteError(err), 'error', 4000);
      } finally {
        deletingRef.current = false;
        setDeleting(false);
      }
    },
    [uid, handleBookmark, showToast]
  );

  // Own pending / rejected submissions use the same edit + delete paths.
  const editSubmission = useCallback((raw) => openEdit(toRoomItem(raw, uid)), [openEdit, uid]);
  const deleteSubmission = useCallback((raw) => askDelete(toRoomItem(raw, uid)), [askDelete, uid]);

  // ─── Community interaction ───────────────────────────────────────────────
  // Only the community cards that will actually be on screen get their
  // "praying" state read (mirrors the list selection in `view` below).
  const prayerIds = useMemo(() => {
    if (activeTab !== 'community') return [];
    return filtered
      .filter((it) => it.sourceId)
      .slice(0, 40)
      .map((it) => it.sourceId);
  }, [activeTab, filtered]);
  const { stateFor, countFor, toggle: togglePray } = usePrayingStates(uid, prayerIds);

  const handlePray = useCallback(
    async (item) => {
      const result = await togglePray(item.sourceId, Number(item.prayCount || 0));
      if (result.ok) {
        if (result.next) showToast('Thank you for praying for this request', 'success', 1800);
        return;
      }
      if (result.reason === 'auth') showToast('Please sign in to pray for this request.', 'error');
      else if (result.reason === 'error') showToast('Could not update right now. Please try again.', 'error');
    },
    [togglePray, showToast]
  );

  const openDetail = useCallback(
    (item) => {
      navigation.navigate('CommunityPrayerDetail', {
        // Plain, serialisable copy (no Firestore Timestamps in route params).
        item: {
          id: item.sourceId,
          title: item.title || '',
          content: item.content || item.verse || '',
          description: item.description || '',
          anonymous: item.anonymous === true,
          username: item.username || '',
          userId: item.userId || '',
          prayCount: countFor(item.sourceId, item.prayCount),
          commentCount: Number(item.commentCount || 0),
        },
      });
    },
    [navigation, countFor]
  );

  // ─── Rows ────────────────────────────────────────────────────────────────
  const communityLoading = community.loading;
  const communityError = community.error;
  const communityRetry = community.retry;
  const adminLoading = admin.loading;
  const adminError = admin.error;
  const adminRetry = admin.retry;
  const mineError = mine.error;
  const mineLoading = mine.loading;

  const view = useMemo(() => {
    const rows = [];
    let firstHeader = true;

    const pushHeader = (key, title, meta, subtitle) => {
      rows.push({ type: 'header', key: `h-${key}`, title, meta, subtitle, first: firstHeader });
      firstHeader = false;
    };
    const pushCards = (key, items, showDate) => {
      if (wide) {
        for (let i = 0; i < items.length; i += 2) {
          rows.push({
            type: 'pair',
            key: `p-${key}-${i}`,
            entries: items.slice(i, i + 2).map((item, j) => ({ item, index: i + j })),
            showDate,
          });
        }
      } else {
        items.forEach((item, index) => rows.push({ type: 'prayer', key: `${key}-${item.id}`, item, index, showDate }));
      }
    };
    const pushSection = (key, title, meta, subtitle, items, showDate) => {
      pushHeader(key, title, meta, subtitle);
      pushCards(key, items, showDate);
    };

    const searching = !!lowerQuery;
    const globalScope = searching || filter === 'saved' || activeTab === 'community';
    const primaryLoading = activeTab === 'daily' ? adminLoading : communityLoading;
    const primaryError = activeTab === 'daily' ? adminError : communityError;
    const primaryRetry = activeTab === 'daily' ? adminRetry : communityRetry;

    if (primaryLoading) {
      rows.push({ type: 'skeleton', key: 'sk' });
      return { rows };
    }
    if (primaryError && !baseItems.length) {
      rows.push({ type: 'error', key: 'err', message: primaryError, onRetry: primaryRetry });
      return { rows };
    }

    // Non-blocking notices when only part of the data could be loaded.
    if (activeTab === 'community' && communityError) {
      rows.push({ type: 'notice', key: 'n-community', text: "Couldn't load community prayers.", onAction: communityRetry });
    }
    if (uid && mineError && !mineLoading) {
      rows.push({ type: 'notice', key: 'n-mine', text: "Couldn't load your own prayers.", onAction: retryMine });
    }

    const matchingSubmissions =
      activeTab === 'community' && filter !== 'saved' && filter !== 'personal'
        ? submissions.filter((raw) => matchesQuery(toRoomItem(raw, uid), lowerQuery))
        : [];
    if (matchingSubmissions.length) {
      pushHeader('submissions', 'Your submissions', String(matchingSubmissions.length));
      matchingSubmissions.forEach((raw) => rows.push({ type: 'status', key: `s-${raw.id}`, item: raw }));
    }

    const emptyFor = () => {
      if (searching) {
        return {
          icon: 'search-outline',
          title: 'No matching prayers',
          message: `Nothing matches "${query}"${filter !== 'all' ? ' with this filter' : ''}. Try a different word.`,
          actionLabel: 'Clear search',
          onAction: 'clear-search',
        };
      }
      if (filter === 'saved') {
        return {
          icon: 'bookmark-outline',
          title: 'No saved prayers yet',
          message: 'Tap the bookmark on any prayer to keep it here for later.',
        };
      }
      if (activeTab === 'community') {
        return {
          icon: 'people-outline',
          title: 'No community requests yet',
          message: 'Approved prayer requests from the community will appear here.',
        };
      }
      if (filter === 'personal') {
        return {
          icon: 'lock-closed-outline',
          title: 'No personal prayers on this day',
          message: 'Your private prayers for this day will appear here.',
        };
      }
      return {
        icon: 'calendar-outline',
        title: selectedDateKey === todayKey ? 'No prayers for today yet' : 'No prayers on this day',
        message:
          selectedDateKey === todayKey
            ? 'Nothing has been posted for today yet. Your prayers will appear here.'
            : 'Nothing was posted on this date. Try another day on the calendar above.',
      };
    };

    if (activeTab === 'daily') {
      const list = globalScope ? filtered : groupsByKey[selectedDateKey] || [];
      if (list.length) {
        const title =
          filter === 'saved'
            ? 'Saved prayers'
            : searching
              ? 'Search results'
              : selectedDateKey === todayKey
                ? "Today's prayers"
                : selectedDateLabel;
        pushSection('main', title, plural(list.length, 'prayer'), null, list, globalScope);
      } else {
        rows.push({ type: 'empty', key: 'empty', ...emptyFor() });
        if (!globalScope) {
          const recent = filtered.filter((it) => prayerDisplayDateKey(it) !== selectedDateKey).slice(0, 3);
          if (recent.length) pushSection('recent', 'Recently added', null, null, recent, true);
        }
      }
    } else if (!filtered.length) {
      if (!matchingSubmissions.length) {
        rows.push({ type: 'empty', key: 'empty', ...emptyFor() });
      }
    } else if (searching || filter === 'saved') {
      pushSection(
        'results',
        filter === 'saved' ? 'Saved prayers' : 'Search results',
        plural(filtered.length, 'prayer'),
        null,
        filtered,
        false
      );
    } else {
      const cutoff = Date.now() - RECENT_WINDOW_MS;
      const recent = filtered.filter((it) => it.sortMs != null && it.sortMs >= cutoff);
      const older = filtered.filter((it) => !(it.sortMs != null && it.sortMs >= cutoff));
      const supported = older
        .filter((it) => Number(it.prayCount || 0) > 0)
        .sort((a, b) => Number(b.prayCount || 0) - Number(a.prayCount || 0));
      const other = older.filter((it) => Number(it.prayCount || 0) <= 0);
      if (recent.length) {
        pushSection('recent', 'Recently shared', plural(recent.length, 'prayer'), null, recent, false);
      }
      if (supported.length) {
        pushSection('supported', 'Receiving support', plural(supported.length, 'prayer'), null, supported, false);
      }
      if (other.length) {
        pushSection('requests', 'Community requests', plural(other.length, 'prayer'), null, other, false);
      }
    }
    return { rows };
  }, [
    activeTab,
    communityLoading,
    communityError,
    communityRetry,
    adminLoading,
    adminError,
    adminRetry,
    mineError,
    mineLoading,
    retryMine,
    uid,
    baseItems.length,
    filter,
    filtered,
    groupsByKey,
    lowerQuery,
    query,
    selectedDateKey,
    selectedDateLabel,
    submissions,
    todayKey,
    wide,
  ]);

  // ─── Rendering ───────────────────────────────────────────────────────────
  const clearSearch = useCallback(() => {
    setSearchInput('');
    setQuery('');
  }, []);

  const renderCard = useCallback(
    (item, index, showDate) => {
      const isCommunity = item.kind === 'community';
      const pray = isCommunity && item.sourceId ? stateFor(item.sourceId) : null;
      return (
        <PrayerRoomCard
          item={item}
          index={index}
          colors={colors}
          accent={accent}
          isDark={isDark}
          isBookmarked={!!bookmarked[item.id]}
          dateLabel={showDate ? formatDateKey(prayerDisplayDateKey(item)) : undefined}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onCopy={handleCopy}
          onOpen={isCommunity ? openDetail : undefined}
          onMenu={item.isMine && item.kind !== 'admin' ? openMenu : undefined}
          onPray={isCommunity ? handlePray : undefined}
          praying={pray ? pray.praying : false}
          prayReady={pray ? pray.ready : false}
          prayBusy={pray ? pray.busy : false}
          prayCount={isCommunity ? countFor(item.sourceId, item.prayCount) : 0}
        />
      );
    },
    [
      colors,
      accent,
      isDark,
      bookmarked,
      handleBookmark,
      handleShare,
      handleCopy,
      openDetail,
      openMenu,
      handlePray,
      stateFor,
      countFor,
    ]
  );

  const runEmptyAction = useCallback(
    (action) => {
      if (action === 'clear-search') clearSearch();
      else if (action === 'create') openCreate();
    },
    [clearSearch, openCreate]
  );

  const renderRow = useCallback(
    ({ item: row }) => {
      switch (row.type) {
        case 'header':
          return (
            <View style={[styles.pad, { marginTop: row.first ? 18 : 12 }]}>
              <PrayerSectionHeader title={row.title} meta={row.meta} subtitle={row.subtitle} colors={colors} />
            </View>
          );
        case 'prayer':
          return <View style={styles.pad}>{renderCard(row.item, row.index, row.showDate)}</View>;
        case 'pair':
          return (
            <View style={[styles.pad, styles.pairRow]}>
              {row.entries.map(({ item, index }) => (
                <View key={item.id} style={styles.pairCell}>
                  {renderCard(item, index, row.showDate)}
                </View>
              ))}
              {row.entries.length === 1 ? <View style={styles.pairCell} /> : null}
            </View>
          );
        case 'status':
          return (
            <View style={styles.pad}>
              <MyPrayerStatusCard
                item={row.item}
                colors={colors}
                onEdit={() => editSubmission(row.item)}
                onDelete={() => deleteSubmission(row.item)}
              />
            </View>
          );
        case 'empty':
          return (
            <View style={styles.pad}>
              <PrayerEmptyState
                icon={row.icon}
                title={row.title}
                message={row.message}
                actionLabel={row.actionLabel}
                onAction={row.onAction ? () => runEmptyAction(row.onAction) : undefined}
                colors={colors}
                accent={accent}
              />
            </View>
          );
        case 'notice':
          return (
            <View style={[styles.pad, { marginTop: 14 }]}>
              <View style={[styles.notice, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.noticeText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {row.text}
                </Text>
                <TouchableOpacity
                  onPress={row.onAction}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.noticeAction, { color: accent }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        case 'skeleton':
          return (
            <View style={[styles.pad, { marginTop: 18 }]}>
              {[0, 1, 2].map((i) => (
                <SkeletonLoader
                  key={i}
                  height={128}
                  borderRadius={18}
                  backgroundColor={colors.bgCardSoft}
                  style={{ marginBottom: 12 }}
                />
              ))}
            </View>
          );
        case 'error':
          return (
            <View style={styles.errorWrap}>
              <LibraryErrorState message={row.message} onRetry={row.onRetry} accent={accent} />
            </View>
          );
        default:
          return null;
      }
    },
    [colors, accent, renderCard, editSubmission, deleteSubmission, runEmptyAction]
  );

  const filterOptions = useMemo(
    () =>
      activeTab === 'daily'
        ? [
            { key: 'all', label: 'All' },
            { key: 'personal', label: 'Personal', icon: 'lock-closed-outline', count: counts.personal },
            { key: 'saved', label: 'Saved', icon: 'bookmark-outline', count: counts.saved },
          ]
        : [
            { key: 'all', label: 'All' },
            { key: 'community', label: 'Community', icon: 'people-outline' },
            { key: 'saved', label: 'Saved', icon: 'bookmark-outline', count: counts.saved },
          ],
    [activeTab, counts]
  );

  const primary = activeTab === 'daily' ? admin : community;
  const showCacheBanner = primary.fromCache && !primary.loading;

  const header = (
    <View>
      {showCacheBanner ? (
        <View style={[styles.cacheBanner, { borderColor: accent + '40', backgroundColor: colors.bgCard }]}>
          <Ionicons name="cloud-offline-outline" size={13} color={accent} />
          <Text style={[styles.cacheText, { color: accent }]}>Showing saved content</Text>
        </View>
      ) : null}

      {activeTab === 'daily' ? (
        <View style={{ marginTop: 20, marginBottom: 18 }}>
          <PrayerDateTimeline
            dates={dates}
            selectedKey={selectedDateKey}
            onSelect={handleSelectDate}
            colors={colors}
            accent={accent}
            countsByKey={groupsByKey}
          />
        </View>
      ) : (
        <View style={{ height: 20 }} />
      )}

      <PrayerSearchBar
        value={searchInput}
        onChangeText={handleSearchChange}
        colors={colors}
        accent={accent}
        onAddPress={openCreate}
      />

      <View style={[styles.pad, { marginTop: 12 }]}>
        <PrayerFilterChips options={filterOptions} value={filter} onChange={setFilter} colors={colors} accent={accent} />
      </View>
    </View>
  );

  const refreshing = activeTab === 'daily' ? admin.refreshing || mine.refreshing : community.refreshing;
  const onRefresh = useCallback(() => {
    if (activeTab === 'daily') {
      refreshAdmin();
      refreshMine();
    } else {
      refreshCommunity();
    }
  }, [activeTab, refreshAdmin, refreshCommunity, refreshMine]);

  const sidePad = Math.max(insets.left, insets.right);
  const listAnimStyle = {
    flex: 1,
    opacity: tabAnim,
    transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingLeft: sidePad, paddingRight: sidePad }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient colors={[colors.bg, colors.bgSecondary]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <BackHeader title="Prayer Room" />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
            activeTab === 'daily' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => switchTab('daily')}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityLabel="Daily Prayers tab"
          accessibilityState={{ selected: activeTab === 'daily' }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'daily' ? colors.white : colors.textSecondary }]}>Daily</Text>
          {submissions.some((p) => p.status === 'rejected') ? (
            <View style={[styles.tabDot, { backgroundColor: activeTab === 'daily' ? colors.white : colors.error }]} />
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
            activeTab === 'community' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => switchTab('community')}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityLabel="Community Prayers tab"
          accessibilityState={{ selected: activeTab === 'community' }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'community' ? colors.white : colors.textSecondary }]}>Community</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={listAnimStyle}>
        <FlatList
          data={view.rows}
          keyExtractor={(row) => row.key}
          renderItem={renderRow}
          ListHeaderComponent={header}
          refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={accent} colors={[accent]} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={9}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
        />
      </Animated.View>

      <PrayerComposerSheet
        visible={composer.visible}
        mode={composer.mode}
        initial={composer.initial}
        defaultCategory={composer.defaultCategory}
        defaultDateKey={composer.defaultDateKey}
        onClose={closeComposer}
        onSaved={handleSaved}
      />

      <PrayerActionSheet
        request={sheet}
        busy={deleting}
        colors={colors}
        isDark={isDark}
        onClose={closeSheet}
        onEdit={openEdit}
        onAskDelete={askDelete}
        onConfirmDelete={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  pad: { paddingHorizontal: PAGE_PAD },
  pairRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pairCell: { flex: 1 },
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
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: PAGE_PAD,
    marginTop: 18,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
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
  tabDot: { width: 7, height: 7, borderRadius: 4 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeText: { flex: 1, fontSize: 12.5, fontWeight: '500' },
  noticeAction: { fontSize: 12.5, fontWeight: '800' },
  errorWrap: { minHeight: 280, justifyContent: 'center', paddingVertical: 24 },
});
