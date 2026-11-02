
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  deleteDoc,
  getDocs,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import ScreenContainer from '../components/common/ScreenContainer';
import BackHeader from '../components/common/BackHeader';
import { DEFAULT_NOTIFICATION_PREFERENCES, NOTIFICATION_CATEGORIES, getNotificationCategory } from '../constants/notifications';
import { getNotificationPermission, setPushEnabled, updateNotificationCategoryPreference } from '../services/notificationService';
import { openNotificationAction, openNotificationDestination } from '../utils/notificationLinks';

const PAGE_SIZE = 20;
const LEGACY_CATEGORY_MAP = {
  dailyVerse: 'scripture',
  prayerReminder: 'engagement',
  bibleReading: 'engagement',
  quizReminder: 'quiz',
  newWallpaper: 'content',
  community: 'announcement',
  appUpdates: 'announcement',
  promo: 'premium',
  premium: 'premium',
};

function getCreatedAtMs(value) {
  if (value?.toMillis) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value || '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mergePage(existing, incoming, source) {
  const merged = new Map(
    existing.filter((item) => item.source === source).map((item) => [item.id, item])
  );
  incoming.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

function whereUserNotification(uid) {
  return where('userId', '==', uid);
}

function normalizePreferences(data) {
  const result = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...data,
    push: { ...DEFAULT_NOTIFICATION_PREFERENCES.push, ...(data.push || {}) },
    inApp: { ...DEFAULT_NOTIFICATION_PREFERENCES.inApp, ...(data.inApp || {}) },
  };
  Object.entries(LEGACY_CATEGORY_MAP).forEach(([legacyId, categoryId]) => {
    if (typeof data[legacyId] !== 'boolean') return;
    if (typeof data.push?.[categoryId] !== 'boolean') result.push[categoryId] = data[legacyId];
    if (typeof data.inApp?.[categoryId] !== 'boolean') result.inApp[categoryId] = data[legacyId];
  });
  return result;
}

function formatTime(value) {
  const milliseconds = getCreatedAtMs(value);
  if (!milliseconds) return 'Just now';
  const elapsed = Math.max(0, Date.now() - milliseconds);
  if (elapsed < 60 * 1000) return 'Just now';
  if (elapsed < 60 * 60 * 1000) return `${Math.floor(elapsed / 60000)}m ago`;
  if (elapsed < 24 * 60 * 60 * 1000) return `${Math.floor(elapsed / 3600000)}h ago`;
  if (elapsed < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(elapsed / 86400000)}d ago`;
  return new Date(milliseconds).toLocaleDateString();
}

function NotificationCard({ item, onOpen, onAction, onDelete }) {
  const { colors } = useTheme();

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={styles.swipeDelete} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={[
        styles.notificationCard,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: item.read ? 0.72 : 1 },
      ]}>
        <TouchableOpacity style={styles.notificationMain} onPress={() => onOpen(item)} activeOpacity={0.7}>
          <View style={styles.notificationIcon}>
            <Ionicons name={item.icon || getNotificationCategory(item.category)?.icon || 'notifications-outline'} size={24} color={Colors.primary} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title || 'Faith Frames update'}</Text>
            <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
              {item.body || item.message || ''}
            </Text>
            <Text style={[styles.notificationTime, { color: colors.textMuted }]}>{formatTime(item.createdAt)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
        {item.action?.label && item.action?.url && (
          <TouchableOpacity style={styles.actionButton} onPress={() => onAction(item)} accessibilityRole="button">
            <Text style={styles.actionButtonText}>{item.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Swipeable>
  );
}

function PreferenceItem({ id, label, icon, value, onToggle, disabled }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.preferenceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.preferenceIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={[styles.preferenceLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => onToggle(id, v)}
        disabled={disabled}
        trackColor={{ false: Colors.border, true: Colors.accentSoft }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'preferences'
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState({ status: 'undetermined', canAskAgain: true });
  const [hasMore, setHasMore] = useState({ inbox: false, legacy: false });
  const cursors = useRef({ inbox: null, legacy: null });
  const initialized = useRef({ inbox: false, legacy: false });
  const itemsBySource = useRef({ inbox: [], legacy: [] });

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      setError('');
      cursors.current = { inbox: null, legacy: null };
      initialized.current = { inbox: false, legacy: false };
      itemsBySource.current = { inbox: [], legacy: [] };
      return undefined;
    }

    setLoading(true);
    setError('');
    setNotifications([]);
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    setHasMore({ inbox: false, legacy: false });
    cursors.current = { inbox: null, legacy: null };
    initialized.current = { inbox: false, legacy: false };
    itemsBySource.current = { inbox: [], legacy: [] };
    const merge = () => {
      setNotifications(
        [...itemsBySource.current.inbox, ...itemsBySource.current.legacy]
          .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt))
      );
      setLoading(false);
    };
    const inboxQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const legacyQuery = query(
      collection(db, 'notifications'),
      whereUserNotification(user.uid),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const unsubscribeInbox = onSnapshot(inboxQuery, (snapshot) => {
      const firstPage = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), source: 'inbox' }));
      itemsBySource.current.inbox = mergePage(itemsBySource.current.inbox, firstPage, 'inbox');
      if (!initialized.current.inbox) {
        cursors.current.inbox = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore((prev) => ({ ...prev, inbox: snapshot.size === PAGE_SIZE }));
        initialized.current.inbox = true;
      }
      setError('');
      merge();
    }, (snapshotError) => {
      console.warn('[Notifications] Inbox subscription failed:', snapshotError?.code, snapshotError?.message);
      setError('Unable to load notifications. Check your connection and retry.');
      setLoading(false);
    });
    const unsubscribeLegacy = onSnapshot(legacyQuery, (snapshot) => {
      const firstPage = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), source: 'legacy' }));
      itemsBySource.current.legacy = mergePage(itemsBySource.current.legacy, firstPage, 'legacy');
      if (!initialized.current.legacy) {
        cursors.current.legacy = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore((prev) => ({ ...prev, legacy: snapshot.size === PAGE_SIZE }));
        initialized.current.legacy = true;
      }
      merge();
    }, (snapshotError) => {
      console.warn('[Notifications] Legacy inbox subscription failed:', snapshotError?.code, snapshotError?.message);
      setError('Unable to load some notifications. Check your connection and retry.');
      setLoading(false);
    });
    const unsubscribePreferences = onSnapshot(doc(db, 'notification_preferences', user.uid), (snapshot) => {
      setPreferences(normalizePreferences(snapshot.exists() ? snapshot.data() : {}));
    }, (snapshotError) => {
      console.warn('[Notifications] Preference subscription failed:', snapshotError?.code, snapshotError?.message);
      setError('Unable to load notification preferences.');
    });
    getNotificationPermission().then(setPermission).catch((permissionError) => {
      console.warn('[Notifications] Could not check device permission:', permissionError?.message);
    });

    return () => {
      unsubscribeInbox();
      unsubscribeLegacy();
      unsubscribePreferences();
    };
  }, [user?.uid]);

  const handleTogglePreference = async (id, value) => {
    if (!user) return;
    const previous = preferences;
    setPreferences((current) => ({
      ...current,
      push: { ...current.push, [id]: value },
      inApp: { ...current.inApp, [id]: value },
      ...(id === 'premium' ? { premium: value } : {}),
    }));
    try {
      await updateNotificationCategoryPreference(user.uid, id, value);
    } catch (err) {
      setPreferences(previous);
      showToast('Failed to update notification preferences', 'error');
      console.error('[Notifications] Preference update failed:', err?.code, err?.message);
    }
  };

  const handleAction = async (item) => {
    try {
      if (!await openNotificationAction(item)) {
        showToast('This action is unavailable', 'error');
      }
    } catch (err) {
      showToast('Could not open this link', 'error');
      console.warn('[Notifications] Action link failed:', err?.message);
    }
  };

  const getNotificationRef = useCallback((item) => (
    item.source === 'legacy'
      ? doc(db, 'notifications', item.id)
      : doc(db, 'users', user.uid, 'notifications', item.id)
  ), [user?.uid]);

  const handleMarkRead = async (item, opened = false) => {
    if (!user) return;
    try {
      await updateDoc(getNotificationRef(item), {
        read: true,
        readAt: serverTimestamp(),
        ...(opened && item.source !== 'legacy'
          ? { opened: true, openedAt: serverTimestamp() }
          : {}),
      });
    } catch (err) {
      showToast('Could not update this notification', 'error');
      console.error('[Notifications] Read update failed:', err?.code, err?.message);
    }
  };

  const handleOpenNotification = async (item) => {
    await handleMarkRead(item, true);
    try {
      const opened = await openNotificationDestination(navigation, item);
      if (!opened && item.deepLink?.type === 'wallpaper') {
        showToast('That wallpaper is no longer available', 'info');
      }
    } catch (err) {
      console.warn('[Notifications] Destination could not be opened:', err?.message);
      showToast('This destination is unavailable', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const unread = notifications.filter((item) => !item.read);
      for (let start = 0; start < unread.length; start += 400) {
        const batch = writeBatch(db);
        unread.slice(start, start + 400).forEach((item) => {
          batch.update(getNotificationRef(item), { read: true, readAt: serverTimestamp() });
        });
        await batch.commit();
      }
      showToast('All marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark as read', 'error');
      console.error('[Notifications] Mark-all-read failed:', err?.code, err?.message);
    }
  };

  const handleDelete = async (item) => {
    if (!user) return;
    try {
      await deleteDoc(getNotificationRef(item));
    } catch (err) {
      showToast('Failed to delete', 'error');
      console.error('[Notifications] Delete failed:', err?.code, err?.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getDocs(query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))),
        getDocs(query(collection(db, 'notifications'), whereUserNotification(user.uid), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))),
      ]);
    } catch (err) {
      showToast('Could not refresh notifications', 'error');
      console.warn('[Notifications] Refresh failed:', err?.code, err?.message);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const requests = [];
      for (const source of ['inbox', 'legacy']) {
        if (!hasMore[source] || !cursors.current[source]) continue;
        const base = source === 'inbox'
          ? collection(db, 'users', user.uid, 'notifications')
          : collection(db, 'notifications');
        const constraints = source === 'legacy'
          ? [whereUserNotification(user.uid), orderBy('createdAt', 'desc'), startAfter(cursors.current[source]), limit(PAGE_SIZE)]
          : [orderBy('createdAt', 'desc'), startAfter(cursors.current[source]), limit(PAGE_SIZE)];
        requests.push(getDocs(query(base, ...constraints)).then((snapshot) => ({ source, snapshot })));
      }
      const pages = await Promise.all(requests);
      pages.forEach(({ source, snapshot }) => {
        const nextItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), source }));
        itemsBySource.current[source] = mergePage(itemsBySource.current[source], nextItems, source);
        if (snapshot.docs.length) cursors.current[source] = snapshot.docs[snapshot.docs.length - 1];
        setHasMore((current) => ({ ...current, [source]: snapshot.size === PAGE_SIZE }));
      });
      setNotifications(
        [...itemsBySource.current.inbox, ...itemsBySource.current.legacy]
          .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt))
      );
    } catch (err) {
      showToast('Could not load more notifications', 'error');
      console.warn('[Notifications] Pagination failed:', err?.code, err?.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePushToggle = async (enabled) => {
    if (!user) return;
    const previous = preferences;
    setPreferences((current) => ({ ...current, pushEnabled: enabled }));
    try {
      const result = await setPushEnabled(user.uid, enabled);
      const currentPermission = await getNotificationPermission();
      setPermission(currentPermission);
      if (!result.success) {
        setPreferences(previous);
        if (result.reason === 'denied' || result.reason === 'permission-required') {
          showToast('Notifications are blocked in device settings', 'error');
        } else if (result.reason === 'push-unavailable') {
          showToast('Push alerts are not available on this device or app build yet', 'error');
        }
      } else {
        showToast(enabled ? 'Push alerts enabled' : 'Push alerts disabled', 'success');
      }
    } catch (err) {
      setPreferences(previous);
      showToast('Could not update push alerts', 'error');
      console.error('[Notifications] Push preference update failed:', err?.code, err?.message);
    }
  };

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const canLoadMore = hasMore.inbox || hasMore.legacy;

  return (
    <ScreenContainer>
      <BackHeader title="Notifications" />
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'feed' ? Colors.primary : colors.textSecondary },
            ]}
          >
            Feed
          </Text>
          {activeTab === 'feed' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preferences' && styles.tabActive]}
          onPress={() => setActiveTab('preferences')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'preferences' ? Colors.primary : colors.textSecondary },
            ]}
          >
            Preferences
          </Text>
          {activeTab === 'preferences' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {activeTab === 'feed' ? (
        <View style={[styles.feedContainer, { paddingTop: insets.top }]}>
          <View style={styles.feedHeader}>
            <View>
              <Text style={[styles.feedTitle, { color: colors.text }]}>Your Notifications</Text>
              <Text style={[styles.notificationCount, { color: colors.textMuted }]}>{unreadCount} unread</Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => `${item.source}-${item.id}`}
            renderItem={({ item }) => (
              <NotificationCard
                item={item}
                onOpen={handleOpenNotification}
                onAction={handleAction}
                onDelete={() => handleDelete(item)}
              />
            )}
            onEndReached={canLoadMore ? loadMore : undefined}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            contentContainerStyle={styles.feedList}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={Colors.primary} style={styles.stateIndicator} />
              ) : error ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
                  <TouchableOpacity onPress={onRefresh}><Text style={styles.markAllText}>Retry</Text></TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You’re all caught up.</Text>
                </View>
              )
            }
            ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={styles.stateIndicator} /> : null}
          />
        </View>
      ) : (
        <ScrollView
          style={[styles.prefsContainer, { paddingTop: insets.top }]}
          contentContainerStyle={styles.prefsList}
        >
          <Text style={[styles.prefsTitle, { color: colors.text }]}>Notification Preferences</Text>
          <View style={[styles.pushCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.pushCopy}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>Push alerts</Text>
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                In-app notifications stay available even when push alerts are off.
              </Text>
            </View>
            <Switch
              value={preferences.pushEnabled === true}
              onValueChange={handlePushToggle}
              trackColor={{ false: Colors.border, true: Colors.accentSoft }}
              thumbColor={preferences.pushEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>
          {permission.status === 'denied' && (
            <TouchableOpacity style={styles.settingsLink} onPress={() => Linking.openSettings()}>
              <Text style={styles.markAllText}>Open device notification settings</Text>
            </TouchableOpacity>
          )}
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <PreferenceItem
              key={cat.id}
              id={cat.id}
              label={cat.label}
              icon={cat.icon}
              value={preferences.push?.[cat.id] ?? cat.defaultPush}
              onToggle={handleTogglePreference}
              disabled={cat.required === true}
            />
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 40,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  feedContainer: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
  },
  feedTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  notificationCount: {
    fontSize: Typography.fontSizeXS,
    marginTop: 2,
  },
  markAllBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  feedList: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.huge,
  },
  notificationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  notificationMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginLeft: 48,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentSoft,
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  notificationTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    marginBottom: Spacing.xs,
  },
  notificationBody: {
    fontSize: Typography.fontSizeSM,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeightMD,
  },
  notificationTime: {
    fontSize: Typography.fontSizeXS,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    marginTop: Spacing.sm,
  },
  swipeActions: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  swipeDelete: {
    width: 70,
    height: '100%',
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefsContainer: {
    flex: 1,
  },
  prefsList: {
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.huge,
  },
  prefsTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    marginVertical: Spacing.lg,
  },
  pushCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  pushCopy: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingsLink: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontSize: Typography.fontSizeMD,
  },
  stateIndicator: {
    paddingVertical: Spacing.xl,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  preferenceLabel: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
});
