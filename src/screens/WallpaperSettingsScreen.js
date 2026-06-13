
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { STORAGE_KEYS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import ScreenContainer from '../components/common/ScreenContainer';
import BackHeader from '../components/common/BackHeader';
import GradientButton from '../components/common/GradientButton';

const WALLPAPER_CATEGORIES = [
  { id: 'bibleVerses', label: 'Bible Verses' },
  { id: 'jesus', label: 'Jesus' },
  { id: 'cross', label: 'Cross' },
  { id: 'worship', label: 'Worship' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'nature', label: 'Nature' },
  { id: 'quotes', label: 'Christian Quotes' },
  { id: 'motivation', label: 'Motivation' },
  { id: 'saints', label: 'Saints' },
  { id: 'festivals', label: 'Festivals' },
];

const QUALITY_OPTIONS = ['Auto', 'HD', 'Full HD', '2K', '4K'];
const DOWNLOAD_OPTIONS = ['WiFi Only', 'Mobile Data', 'Always Download'];
const AUTO_WALLPAPER_OPTIONS = ['Off', 'Daily', 'Weekly', 'Monthly'];

function SectionHeader({ title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function SettingToggle({ label, value, onToggle, icon }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon && (
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
      )}
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.accentSoft }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

function SettingPicker({ label, options, selectedValue, onSelect, icon }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon && (
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
      )}
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.pickerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.pickerOption,
                selectedValue === option && { backgroundColor: Colors.primary },
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.pickerText,
                  { color: selectedValue === option ? Colors.white : colors.textSecondary },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function StorageCard({ cacheSize, downloadCount, favoriteCount, onClearCache, onRemoveDownloads }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.storageRow}>
        <View style={styles.storageItem}>
          <Text style={[styles.storageNumber, { color: colors.text }]}>{cacheSize}</Text>
          <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Cache</Text>
        </View>
        <View style={styles.storageDivider} />
        <View style={styles.storageItem}>
          <Text style={[styles.storageNumber, { color: colors.text }]}>{downloadCount}</Text>
          <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Downloads</Text>
        </View>
        <View style={styles.storageDivider} />
        <View style={styles.storageItem}>
          <Text style={[styles.storageNumber, { color: colors.text }]}>{favoriteCount}</Text>
          <Text style={[styles.storageLabel, { color: colors.textSecondary }]}>Favorites</Text>
        </View>
      </View>
      <View style={styles.storageButtons}>
        <TouchableOpacity style={styles.storageBtn} onPress={onClearCache}>
          <Text style={styles.storageBtnText}>Clear Cache</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.storageBtn} onPress={onRemoveDownloads}>
          <Text style={styles.storageBtnText}>Remove Downloads</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WallpaperSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    categories: {},
    quality: 'Auto',
    downloadPreference: 'WiFi Only',
    autoWallpaper: 'Off',
  });
  const [storageInfo, setStorageInfo] = useState({
    cacheSize: '12.5 MB',
    downloadCount: 45,
    favoriteCount: 128,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try local storage
        const localSettings = await AsyncStorage.getItem('wallpaper_settings');
        if (localSettings) {
          setSettings(JSON.parse(localSettings));
        }

        // Then try Firebase
        if (user) {
          const firestoreSettings = await getDoc(doc(db, 'wallpaper_preferences', user.uid));
          if (firestoreSettings.exists()) {
            const data = firestoreSettings.data();
            setSettings(data);
            await AsyncStorage.setItem('wallpaper_settings', JSON.stringify(data));
          }
        }
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    // Initialize categories if not set
    const initCategories = async () => {
      const currentSettings = await AsyncStorage.getItem('wallpaper_settings');
      if (!currentSettings) {
        const defaultCats = WALLPAPER_CATEGORIES.reduce((acc, cat) => {
          acc[cat.id] = true;
          return acc;
        }, {});
        setSettings((prev) => ({ ...prev, categories: defaultCats }));
      }
    };

    loadSettings();
    initCategories();
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
    const newCategories = {
      ...settings.categories,
      [id]: !settings.categories[id],
    };
    saveSettings({ ...settings, categories: newCategories });
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear the cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          setStorageInfo({ ...storageInfo, cacheSize: '0 MB' });
          showToast('Cache cleared', 'success');
        },
      },
    ]);
  };

  const handleRemoveDownloads = () => {
    Alert.alert('Remove Downloads', 'Are you sure you want to remove all downloads?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => {
          setStorageInfo({ ...storageInfo, downloadCount: 0 });
          showToast('Downloads removed', 'success');
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.huge },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title="Wallpaper Settings" />

        {/* Current Wallpaper Preview */}
        <SectionHeader title="Current Wallpaper" subtitle="Your current wallpaper" />
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.previewGradient} />
          <View style={styles.previewInfo}>
            <View>
              <Text style={[styles.previewTitle, { color: colors.text }]}>Divine Grace</Text>
              <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                Bible Verses • HD
              </Text>
            </View>
            <TouchableOpacity style={styles.previewBtn}>
              <Ionicons name="expand-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <SectionHeader title="Categories" subtitle="Select your interests" />
        <View style={styles.categoriesGrid}>
          {WALLPAPER_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                settings.categories[cat.id] && { backgroundColor: Colors.primary },
                { borderColor: settings.categories[cat.id] ? Colors.primary : colors.border },
              ]}
              onPress={() => handleToggleCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: settings.categories[cat.id] ? Colors.white : colors.text },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quality */}
        <SectionHeader title="Quality" subtitle="Choose download quality" />
        <SettingPicker
          label="Download Quality"
          options={QUALITY_OPTIONS}
          selectedValue={settings.quality}
          onSelect={(value) => saveSettings({ ...settings, quality: value })}
          icon="image-outline"
        />

        {/* Download Preferences */}
        <SectionHeader title="Download Preferences" subtitle="When to download wallpapers" />
        <SettingPicker
          label="Network Preference"
          options={DOWNLOAD_OPTIONS}
          selectedValue={settings.downloadPreference}
          onSelect={(value) => saveSettings({ ...settings, downloadPreference: value })}
          icon="wifi-outline"
        />

        {/* Storage Management */}
        <SectionHeader title="Storage" subtitle="Manage your storage" />
        <StorageCard
          cacheSize={storageInfo.cacheSize}
          downloadCount={storageInfo.downloadCount}
          favoriteCount={storageInfo.favoriteCount}
          onClearCache={handleClearCache}
          onRemoveDownloads={handleRemoveDownloads}
        />

        {/* Auto Wallpaper */}
        <SectionHeader title="Auto Wallpaper" subtitle="Change wallpaper automatically" />
        <SettingPicker
          label="Auto Change"
          options={AUTO_WALLPAPER_OPTIONS}
          selectedValue={settings.autoWallpaper}
          onSelect={(value) => saveSettings({ ...settings, autoWallpaper: value })}
          icon="refresh-outline"
        />

        {/* Recommendations */}
        <SectionHeader
          title="Recommendations"
          subtitle="Based on your Bible reading and quiz preferences"
        />
        <View style={[styles.recommendationsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.recommendationsIcon}>
            <Ionicons name="star" size={28} color={Colors.primary} />
          </View>
          <Text style={[styles.recommendationsText, { color: colors.text }]}>
            Smart recommendations are enabled! We'll suggest wallpapers based on your activity.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.xxxl },
  sectionHeader: { marginBottom: Spacing.md, marginTop: Spacing.xxxl },
  sectionTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.xs,
  },
  previewCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewGradient: {
    height: 180,
    width: '100%',
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
    marginTop: Spacing.xs,
  },
  previewBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  pickerContainer: { flex: 2 },
  pickerScroll: { flexGrow: 0 },
  pickerOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
  },
  storageCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  storageItem: {
    alignItems: 'center',
    flex: 1,
  },
  storageNumber: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
  },
  storageLabel: {
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.xs,
  },
  storageDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  storageButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  storageBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  storageBtnText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  recommendationsCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  recommendationsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recommendationsText: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    lineHeight: Typography.lineHeightLG,
  },
});

