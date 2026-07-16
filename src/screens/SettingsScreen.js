import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { APP_NAME, APP_VERSION } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ScreenContainer from '../components/common/ScreenContainer';
import useFavorites from '../hooks/useFavorites';
import useStoryBookmarks from '../hooks/useStoryBookmarks';
import useSavedVideos from '../hooks/useSavedVideos';

function StatCard({ icon, label, value, colors, isDark }) {
  const cardBg = isDark ? '#101010' : '#F5F5F5';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.statValue, { color: textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textSecondary }]}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, danger, colors, isDark }) {
  const rowBg = isDark ? '#101010' : '#F5F5F5';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const iconBg = danger
    ? 'rgba(244,67,54,0.1)'
    : (isDark ? 'rgba(255,122,0,0.1)' : 'rgba(255,122,0,0.1)');
  const iconColor = danger ? '#F44336' : colors.primary;
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: rowBg, borderBottomColor: borderColor }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? '#F44336' : textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: textSecondary }]} numberOfLines={1}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={textSecondary} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, userProfile, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { favorites } = useFavorites();
  const { bookmarks } = useStoryBookmarks();
  const { savedVideos } = useSavedVideos();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          showToast('Signed out successfully', 'info');
        },
      },
    ]);
  };

  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#101010' : '#F5F5F5';

  return (
    <ScreenContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: textPrimary }]}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} hitSlop={12}>
            <Ionicons name="pencil" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          {userProfile?.photoURL ? (
            <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[colors.primary, '#FF9A33']} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.name || user?.email || 'U')[0].toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textPrimary }]}>{userProfile?.name || 'Believer'}</Text>
            <Text style={[styles.profileEmail, { color: textSecondary }]}>{user?.email}</Text>
            {userProfile?.isPremium ? (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color={colors.primary} />
                <Text style={[styles.premiumText, { color: colors.primary }]}>Premium</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity onPress={() => navigation.navigate('FavoriteWallpapers')} activeOpacity={0.8}>
            <StatCard icon="images" label="Favorite Wallpapers" value={String(favorites.length)} colors={colors} isDark={isDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FavoriteStories')} activeOpacity={0.8}>
            <StatCard icon="bookmark" label="Favorite Stories" value={String(bookmarks.length)} colors={colors} isDark={isDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SavedVideos')} activeOpacity={0.8}>
            <StatCard icon="videocam" label="Saved Videos" value={String(savedVideos.length)} colors={colors} isDark={isDark} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            value={isDark ? 'On' : 'Off'}
            onPress={toggleTheme}
            colors={colors}
            isDark={isDark}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Support</Text>
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <SettingRow
            icon="mail-outline"
            label="Contact Us"
            onPress={() => navigation.navigate('ContactUs')}
            colors={colors}
            isDark={isDark}
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            colors={colors}
            isDark={isDark}
          />
          <SettingRow
            icon="image-outline"
            label="Wallpaper Settings"
            onPress={() => navigation.navigate('WallpaperSettings')}
            colors={colors}
            isDark={isDark}
          />
          <SettingRow
            icon="information-circle-outline"
            label="App Version"
            value={APP_VERSION}
            colors={colors}
            isDark={isDark}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Legal & Information</Text>
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <SettingRow
            icon="information-circle-outline"
            label="About Us"
            onPress={() => navigation.navigate('About')}
            colors={colors}
            isDark={isDark}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            colors={colors}
            isDark={isDark}
          />
          <SettingRow
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => navigation.navigate('TermsConditions')}
            colors={colors}
            isDark={isDark}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger colors={colors} isDark={isDark} />
        </View>

        <Text style={[styles.footer, { color: textSecondary }]}>{APP_NAME} — Premium Faith Wallpapers</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  section: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    marginRight: 8,
    maxWidth: 120,
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 48,
    marginBottom: 24,
  },
});
