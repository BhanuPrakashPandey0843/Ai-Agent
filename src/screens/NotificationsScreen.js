
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import ScreenContainer from '../components/common/ScreenContainer';
import BackHeader from '../components/common/BackHeader';

const NOTIFICATION_CATEGORIES = [
  { id: 'dailyVerse', label: 'Daily Verse', icon: 'book-outline', default: true },
  { id: 'prayerReminder', label: 'Prayer Reminder', icon: 'heart-outline', default: true },
  { id: 'bibleReading', label: 'Bible Reading', icon: 'book-outline', default: true },
  { id: 'quizReminder', label: 'Quiz Reminder', icon: 'bulb-outline', default: true },
  { id: 'newWallpaper', label: 'New Wallpaper', icon: 'image-outline', default: true },
  { id: 'community', label: 'Community Updates', icon: 'people-outline', default: false },
  { id: 'appUpdates', label: 'App Updates', icon: 'gift-outline', default: true },
  { id: 'promo', label: 'Promotional Messages', icon: 'megaphone-outline', default: false },
  { id: 'premium', label: 'Premium Content', icon: 'diamond-outline', default: true },
];

function NotificationCard({ item, onMarkRead, onDelete }) {
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
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: item.read ? 0.6 : 1 },
        ]}
        onPress={() => !item.read && onMarkRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <Ionicons name={item.icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
            {item.body}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
            {item.time}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Swipeable>
  );
}

function PreferenceItem({ id, label, icon, value, onToggle }) {
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
        trackColor={{ false: Colors.border, true: Colors.accentSoft }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'preferences'
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Load preferences
    const loadPreferences = async () => {
      try {
        const prefsDoc = await getDoc(doc(db, 'notification_preferences', user.uid));
        if (prefsDoc.exists()) {
          setPreferences(prefsDoc.data());
        } else {
          // Set defaults
          const defaultPrefs = NOTIFICATION_CATEGORIES.reduce((acc, cat) => {
            acc[cat.id] = cat.default;
            return acc;
          }, {});
          setPreferences(defaultPrefs);
          await setDoc(doc(db, 'notification_preferences', user.uid), defaultPrefs);
        }
      } catch (err) {
        // Ignore errors
      }
    };

    // Subscribe to notifications
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: 'Just now',
      }));
      setNotifications(data);
      setLoading(false);
    });

    loadPreferences();

    return unsubscribe;
  }, [user]);

  const handleTogglePreference = async (id, value) => {
    if (!user) return;
    const newPrefs = { ...preferences, [id]: value };
    setPreferences(newPrefs);
    try {
      await updateDoc(doc(db, 'notification_preferences', user.uid), { [id]: value });
    } catch (err) {
      showToast('Failed to update preferences', 'error');
    }
  };

  const handleMarkRead = async (id) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();
      showToast('All marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'notifications', id));
      await batch.commit();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

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
            <Text style={[styles.feedTitle, { color: colors.text }]}>Your Notifications</Text>
            {notifications.some((n) => !n.read) && (
              <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationCard
                item={item}
                onMarkRead={handleMarkRead}
                onDelete={() => handleDelete(item.id)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            contentContainerStyle={styles.feedList}
          />
        </View>
      ) : (
        <ScrollView
          style={[styles.prefsContainer, { paddingTop: insets.top }]}
          contentContainerStyle={styles.prefsList}
        >
          <Text style={[styles.prefsTitle, { color: colors.text }]}>Notification Preferences</Text>
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <PreferenceItem
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              value={preferences[cat.id] ?? cat.default}
              onToggle={handleTogglePreference}
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
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
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

