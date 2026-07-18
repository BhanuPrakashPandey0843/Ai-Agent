import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, Spacing, BorderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import ScreenContainer from '../components/common/ScreenContainer';
import BackHeader from '../components/common/BackHeader';

const WALLPAPER_CATEGORIES = [
  { id: 'bibleVerses', label: 'Bible Verses', icon: 'book-outline' },
  { id: 'jesus', label: 'Jesus', icon: 'sunny-outline' },
  { id: 'cross', label: 'Cross', icon: 'add-outline' },
  { id: 'worship', label: 'Worship', icon: 'musical-notes-outline' },
  { id: 'prayer', label: 'Prayer', icon: 'hand-left-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'quotes', label: 'Christian Quotes', icon: 'chatbox-ellipses-outline' },
  { id: 'motivation', label: 'Motivation', icon: 'flame-outline' },
  { id: 'saints', label: 'Saints', icon: 'sparkles-outline' },
  { id: 'festivals', label: 'Festivals', icon: 'star-outline' },
];

const QUALITY_OPTIONS = ['Auto', 'HD', 'Full HD', '2K', '4K'];
const DOWNLOAD_OPTIONS = ['WiFi Only', 'Mobile Data', 'Always Download'];
const AUTO_WALLPAPER_OPTIONS = ['Off', 'Daily', 'Weekly', 'Monthly'];

/** Staggered fade + rise entrance, matching the app's card-reveal language. */
function Reveal({ delay = 0, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Spring press-scale wrapper with a light haptic tick — used on every tappable control below. */
function Pressy({ onPress, children, style, haptic = true, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, friction: 8, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  const handlePress = () => {
    if (haptic) Haptics.selectionAsync();
    onPress?.();
  };
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={handlePress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  const { colors } = useTheme();
  const ACCENT = colors.primary;
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
        <Ionicons name={icon} size={16} color={ACCENT} />
      </View>
      <View style={styles.sectionHeaderText}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function SettingToggle({ label, description, value, onToggle, icon }) {
  const { colors } = useTheme();
  const ACCENT = colors.primary;
  return (
    <View style={[styles.settingItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: ACCENT + '16' }]}>
        <Ionicons name={icon} size={18} color={ACCENT} />
      </View>
      <View style={styles.settingTextCol}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        {description ? (
          <Text style={[styles.settingDescription, { color: colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onToggle(v);
        }}
        trackColor={{ false: colors.border, true: ACCENT + '55' }}
        thumbColor={value ? ACCENT : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function SettingPicker({ label, options, selectedValue, onSelect, icon }) {
  const { colors } = useTheme();
  const ACCENT = colors.primary;
  return (
    <View style={[styles.settingItem, styles.settingItemColumn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.pickerHeaderRow}>
        <View style={[styles.settingIcon, { backgroundColor: ACCENT + '16' }]}>
          <Ionicons name={icon} size={18} color={ACCENT} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {options.map((option) => {
          const active = selectedValue === option;
          return (
            <Pressy key={option} onPress={() => onSelect(option)} style={{ marginRight: Spacing.sm }}>
              <View
                style={[
                  styles.pickerOption,
                  {
                    backgroundColor: active ? ACCENT : colors.bg,
                    borderColor: active ? ACCENT : colors.border,
                  },
                ]}
              >
                <Text style={[styles.pickerText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                  {option}
                </Text>
              </View>
            </Pressy>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StorageCard({ cacheSize, downloadCount, favoriteCount, onClearCache, onRemoveDownloads }) {
  const { colors } = useTheme();
  const ACCENT = colors.primary;
  const stats = [
    { icon: 'server-outline', value: cacheSize, label: 'Cache used' },
    { icon: 'download-outline', value: String(downloadCount), label: 'Downloads' },
    { icon: 'heart-outline', value: String(favoriteCount), label: 'Favorites' },
  ];
  return (
    <View style={[styles.storageCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.storageRow}>
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            <View style={styles.storageItem}>
              <View style={[styles.storageIconWrap, { backgroundColor: ACCENT + '14' }]}>
                <Ionicons name={s.icon} size={16} color={ACCENT} />
              </View>
              <Text style={[styles.storageNumber, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.storageLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
            {i < stats.length - 1 ? <View style={[styles.storageDivider, { backgroundColor: colors.border }]} /> : null}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.storageButtons}>
        <Pressy onPress={onClearCache} style={{ flex: 1 }}>
          <View style={[styles.storageBtn, { borderColor: colors.border }]}>
            <Ionicons name="trash-outline" size={15} color={ACCENT} />
            <Text style={[styles.storageBtnText, { color: ACCENT }]}>Clear cache</Text>
          </View>
        </Pressy>
        <Pressy onPress={onRemoveDownloads} style={{ flex: 1 }}>
          <View style={[styles.storageBtn, { borderColor: colors.border }]}>
            <Ionicons name="close-circle-outline" size={15} color={ACCENT} />
            <Text style={[styles.storageBtnText, { color: ACCENT }]}>Remove downloads</Text>
          </View>
        </Pressy>
      </View>
    </View>
  );
}

export default function WallpaperSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const ACCENT = colors.primary;
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    categories: {},
    quality: 'Auto',
    downloadPreference: 'WiFi Only',
    autoWallpaper: 'Off',
    smartRecommendations: true,
  });
  const [storageInfo, setStorageInfo] = useState({
    cacheSize: '12.5 MB',
    downloadCount: 45,
    favoriteCount: 128,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const localSettings = await AsyncStorage.getItem('wallpaper_settings');
        if (localSettings) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(localSettings) }));
        } else {
          const defaultCats = WALLPAPER_CATEGORIES.reduce((acc, cat) => {
            acc[cat.id] = true;
            return acc;
          }, {});
          setSettings((prev) => ({ ...prev, categories: defaultCats }));
        }

        if (user) {
          const firestoreSettings = await getDoc(doc(db, 'wallpaper_preferences', user.uid));
          if (firestoreSettings.exists()) {
            const data = firestoreSettings.data();
            setSettings((prev) => ({ ...prev, ...data }));
            await AsyncStorage.setItem('wallpaper_settings', JSON.stringify(data));
          }
        }
      } catch (err) {
        // Silent — local defaults already applied
      }
    };

    loadSettings();
  }, [user]);

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('wallpaper_settings', JSON.stringify(newSettings));
      if (user) {
        await setDoc(doc(db, 'wallpaper_preferences', user.uid), newSettings, { merge: true });
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleToggleCategory = (id) => {
    Haptics.selectionAsync();
    const newCategories = { ...settings.categories, [id]: !settings.categories[id] };
    saveSettings({ ...settings, categories: newCategories });
  };

  const handleClearCache = () => {
    Alert.alert('Clear cache', 'Are you sure you want to clear the cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          setStorageInfo((s) => ({ ...s, cacheSize: '0 MB' }));
          showToast('Cache cleared', 'success');
        },
      },
    ]);
  };

  const handleRemoveDownloads = () => {
    Alert.alert('Remove downloads', 'Are you sure you want to remove all downloads?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setStorageInfo((s) => ({ ...s, downloadCount: 0 }));
          showToast('Downloads removed', 'success');
        },
      },
    ]);
  };

  const selectedCount = Object.values(settings.categories).filter(Boolean).length;

  return (
    <ScreenContainer>
      <BackHeader title="Wallpaper Settings" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.huge }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero preview */}
        <Reveal delay={0}>
          <View style={styles.previewCard}>
            <LinearGradient colors={colors.gradientPrimary} style={styles.previewGradient}>
              <View style={styles.previewGlyphRow}>
                <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.85)" />
              </View>
            </LinearGradient>
            <View style={[styles.previewInfo, { backgroundColor: colors.bgCard }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Current wallpaper</Text>
                <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>
                  Divine Grace · Bible Verses · {settings.quality}
                </Text>
              </View>
              <Pressy onPress={() => {}} haptic={false}>
                <View style={[styles.previewBtn, { backgroundColor: ACCENT + '18' }]}>
                  <Ionicons name="expand-outline" size={20} color={ACCENT} />
                </View>
              </Pressy>
            </View>
          </View>
        </Reveal>

        {/* Categories */}
        <Reveal delay={70}>
          <SectionHeader
            title="Categories"
            subtitle={`${selectedCount} of ${WALLPAPER_CATEGORIES.length} selected`}
            icon="grid-outline"
          />
          <View style={styles.categoriesGrid}>
            {WALLPAPER_CATEGORIES.map((cat) => {
              const active = !!settings.categories[cat.id];
              return (
                <Pressy key={cat.id} onPress={() => handleToggleCategory(cat.id)}>
                  <View
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: active ? ACCENT : colors.bgCard,
                        borderColor: active ? ACCENT : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={active ? '#FFFFFF' : colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.categoryText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                      {cat.label}
                    </Text>
                  </View>
                </Pressy>
              );
            })}
          </View>
        </Reveal>

        {/* Quality */}
        <Reveal delay={120}>
          <SectionHeader title="Quality" subtitle="Choose your download resolution" icon="diamond-outline" />
          <SettingPicker
            label="Download quality"
            options={QUALITY_OPTIONS}
            selectedValue={settings.quality}
            onSelect={(value) => saveSettings({ ...settings, quality: value })}
            icon="image-outline"
          />
        </Reveal>

        {/* Download preferences */}
        <Reveal delay={170}>
          <SectionHeader title="Download preferences" subtitle="Control when wallpapers download" icon="cloud-download-outline" />
          <SettingPicker
            label="Network preference"
            options={DOWNLOAD_OPTIONS}
            selectedValue={settings.downloadPreference}
            onSelect={(value) => saveSettings({ ...settings, downloadPreference: value })}
            icon="wifi-outline"
          />
        </Reveal>

        {/* Auto wallpaper */}
        <Reveal delay={220}>
          <SectionHeader title="Auto wallpaper" subtitle="Refresh your lock screen automatically" icon="refresh-outline" />
          <SettingPicker
            label="Auto change"
            options={AUTO_WALLPAPER_OPTIONS}
            selectedValue={settings.autoWallpaper}
            onSelect={(value) => saveSettings({ ...settings, autoWallpaper: value })}
            icon="time-outline"
          />
        </Reveal>

        {/* Storage */}
        <Reveal delay={270}>
          <SectionHeader title="Storage" subtitle="Manage space used on this device" icon="albums-outline" />
          <StorageCard
            cacheSize={storageInfo.cacheSize}
            downloadCount={storageInfo.downloadCount}
            favoriteCount={storageInfo.favoriteCount}
            onClearCache={handleClearCache}
            onRemoveDownloads={handleRemoveDownloads}
          />
        </Reveal>

        {/* Recommendations */}
        <Reveal delay={320}>
          <SectionHeader title="Recommendations" subtitle="Personalized picks for you" icon="sparkles-outline" />
          <View style={[styles.recommendationsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.recommendationsIcon, { backgroundColor: ACCENT + '16' }]}>
              <Ionicons name="star" size={22} color={ACCENT} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Smart recommendations</Text>
              <Text style={[styles.recommendationsText, { color: colors.textMuted }]}>
                We'll suggest wallpapers based on your Bible reading and quiz activity.
              </Text>
            </View>
            <Switch
              value={settings.smartRecommendations}
              onValueChange={(v) => {
                Haptics.selectionAsync();
                saveSettings({ ...settings, smartRecommendations: v });
              }}
              trackColor={{ false: colors.border, true: ACCENT + '55' }}
              thumbColor={settings.smartRecommendations ? ACCENT : colors.textMuted}
              ios_backgroundColor={colors.border}
            />
          </View>
        </Reveal>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xxl,
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.1,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizeSM,
    marginTop: 2,
  },

  previewCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  previewGradient: {
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewGlyphRow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  previewTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  previewSubtitle: {
    fontSize: Typography.fontSizeSM,
    marginTop: 2,
  },
  previewBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  settingItemColumn: { flexDirection: 'column', alignItems: 'stretch' },
  pickerHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingTextCol: { flex: 1 },
  settingLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
  },
  settingDescription: {
    fontSize: Typography.fontSizeSM,
    marginTop: 2,
    lineHeight: Typography.lineHeightSM,
  },

  pickerScroll: { flexGrow: 0 },
  pickerOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },

  storageCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  storageItem: { alignItems: 'center', flex: 1, gap: 4 },
  storageIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  storageNumber: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
  },
  storageLabel: {
    fontSize: Typography.fontSizeXS,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  storageDivider: { width: 1, height: 46 },
  storageButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  storageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  storageBtnText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },

  recommendationsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recommendationsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recommendationsText: {
    fontSize: Typography.fontSizeSM,
    lineHeight: Typography.lineHeightSM,
    marginTop: 2,
  },
});
