import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Share,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';
import BackHeader from '../components/common/BackHeader';
import CompactActionButton from '../components/common/CompactActionButton';
import CircleIconButton from '../components/common/CircleIconButton';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography } from '../theme/colors';
import { getOrDownloadWallpaper, mapErrorToMessage } from '../utils/wallpaperFile';
import {
  isNativeWallpaperAvailable,
  isLockScreenSupported,
  setNativeWallpaper,
} from '../native/WallpaperManager';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function WallpaperDetailScreen({ route }) {
  const { wallpaper } = route.params;
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { toggle, isFavorite } = useFavorites();
  const { isDark, colors, Shadows } = useTheme();

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const [wallpaperProgress, setWallpaperProgress] = useState(0);
  const [sharing, setSharing] = useState(false);

  const fav = isFavorite(wallpaper.id);

  const heartScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Favorite ─────────────────────────────────────────────────────────────
  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 0.75, duration: 90, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
    toggle(wallpaper.id);
  };

  // ─── Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (downloading || settingWallpaper) return;
    try {
      setDownloading(true);
      setDownloadProgress(0);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission needed to save wallpapers', 'error');
        return;
      }

      const localUri = await getOrDownloadWallpaper(wallpaper.uri, wallpaper.id, setDownloadProgress);
      await MediaLibrary.saveToLibraryAsync(localUri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Wallpaper saved to gallery!', 'success');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(mapErrorToMessage(err), 'error');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // ─── Share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (sharing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setSharing(true);
      const localUri = await getOrDownloadWallpaper(wallpaper.uri, wallpaper.id);
      const canShareFiles = await Sharing.isAvailableAsync();

      if (canShareFiles) {
        await Sharing.shareAsync(localUri, {
          dialogTitle: wallpaper.title || 'Faith Frames Wallpaper',
        });
      } else {
        await Share.share({
          message: `Check out "${wallpaper.title}" on Faith Frames!`,
          url: wallpaper.uri,
        });
      }
    } catch (err) {
      if (err?.message !== 'User did not share') {
        showToast(mapErrorToMessage(err), 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  // ─── Set as Wallpaper ─────────────────────────────────────────────────────
  const applyWallpaper = async (target) => {
    try {
      setSettingWallpaper(true);
      setWallpaperProgress(0);

      const localUri = await getOrDownloadWallpaper(wallpaper.uri, wallpaper.id, setWallpaperProgress);

      if (Platform.OS === 'android') {
        await setNativeWallpaper(localUri, target);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(
          target === 'both'
            ? 'Applied to Home & Lock screen'
            : target === 'home'
            ? 'Applied to Home screen'
            : 'Applied to Lock screen',
          'success'
        );
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          showToast('Photo library permission is needed to save this wallpaper.', 'error');
          return;
        }
        await MediaLibrary.saveToLibraryAsync(localUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Saved! Open Photos → Share → "Use as Wallpaper".', 'success');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(mapErrorToMessage(err), 'error');
    } finally {
      setSettingWallpaper(false);
      setWallpaperProgress(0);
    }
  };

  const showSetWallpaperOptions = async () => {
    if (settingWallpaper || downloading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      Alert.alert(
        'Set as Wallpaper',
        "Apple doesn't allow apps to change your wallpaper directly. We'll save this image to your Photos so you can set it from there.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save to Photos', onPress: () => applyWallpaper('both') },
        ]
      );
      return;
    }

    if (!isNativeWallpaperAvailable()) {
      Alert.alert(
        'Update Required',
        'This feature needs the latest app build to work. Please update or reinstall Faith Frames.'
      );
      return;
    }

    const lockSupported = await isLockScreenSupported();
    if (!lockSupported) {
      applyWallpaper('home');
      return;
    }

    Alert.alert('Set as Wallpaper', 'Choose where to apply it', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Home Screen', onPress: () => applyWallpaper('home') },
      { text: 'Lock Screen', onPress: () => applyWallpaper('lock') },
      { text: 'Both', onPress: () => applyWallpaper('both') },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BackHeader title="" transparent />

      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: wallpaper.uri }}
            style={styles.image}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
            style={styles.imageOverlay}
          />
        </View>

        <View style={[styles.infoSection, { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.title,
                  { color: colors.textPrimary, fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightBold },
                ]}
              >
                {wallpaper.title}
              </Text>
              {(wallpaper.country || wallpaper.location) && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.locationText, { color: colors.textMuted, fontSize: Typography.fontSizeMD }]}>
                    {[wallpaper.location, wallpaper.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            {wallpaper.category && (
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.badgeText, { color: colors.primary, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold }]}>
                  {wallpaper.category}
                </Text>
              </View>
            )}
            {wallpaper.rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={[styles.ratingText, { color: colors.primary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold }]}>
                  {wallpaper.rating}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Compact bottom action bar */}
      <Animated.View
        style={[
          styles.actions,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: isDark ? 'rgba(5,5,10,0.98)' : 'rgba(255,255,255,0.98)',
            borderTopColor: colors.border,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.iconRow}>
          <CircleIconButton
            size={48}
            onPress={handleToggleFavorite}
            backgroundColor={colors.bgCard}
            borderColor={colors.border}
            hapticStyle={Haptics.ImpactFeedbackStyle.Heavy}
            style={Shadows.card(isDark)}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={24}
                color={fav ? colors.primary : colors.textMuted}
              />
            </Animated.View>
          </CircleIconButton>

          <CircleIconButton
            size={48}
            onPress={handleShare}
            backgroundColor={colors.bgCard}
            borderColor={colors.border}
            style={Shadows.card(isDark)}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="share-outline" size={22} color={colors.primary} />
            )}
          </CircleIconButton>
        </View>

        <View style={styles.buttonRow}>
          <CompactActionButton
            title={settingWallpaper ? 'Applying' : 'Set Wallpaper'}
            icon="phone-portrait-outline"
            onPress={showSetWallpaperOptions}
            loading={settingWallpaper}
            progress={settingWallpaper ? wallpaperProgress : undefined}
            disabled={downloading}
            colors={colors.gradientPrimary}
            style={{ flex: 1 }}
          />
          <CompactActionButton
            title={downloading ? 'Saving' : 'Download'}
            icon="download-outline"
            onPress={handleDownload}
            loading={downloading}
            progress={downloading ? downloadProgress : undefined}
            disabled={settingWallpaper}
            colors={colors.gradientWallpaper}
            style={{ flex: 1 }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_H * 0.78,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  infoSection: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  badge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
  },
  badgeText: {},
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  ratingText: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  locationText: {},
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: 12,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
