import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ScreenContainer from '../components/common/ScreenContainer';

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, userProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

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

  const score = userProfile?.lastScore ?? 0;
  const coins = userProfile?.coins ?? 0;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={[styles.profileCard, Shadows.card]}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(userProfile?.name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.name || 'Believer'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {userProfile?.isPremium ? (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color={Colors.primary} />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="star" label="Last Score" value={String(score)} />
          <StatCard icon="flame" label="Coins" value={String(coins)} />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.section}>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            value={isDark ? 'On' : 'Off'}
            onPress={toggleTheme}
          />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.section}>
          <SettingRow icon="mail-outline" label="Contact Support" value={SUPPORT_EMAIL} />
          <SettingRow icon="information-circle-outline" label="App Version" value={APP_VERSION} />
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>

        <Text style={styles.footer}>{APP_NAME} — Premium Faith Wallpapers</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.xxxl },
  screenTitle: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.white,
  },
  profileInfo: { flex: 1, marginLeft: Spacing.lg },
  profileName: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  premiumText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowIconDanger: { backgroundColor: 'rgba(244,67,54,0.1)' },
  rowLabel: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightMedium,
  },
  rowLabelDanger: { color: Colors.error },
  rowValue: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
    maxWidth: 120,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.huge,
    marginBottom: Spacing.xxl,
  },
});
