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
  Linking,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';
import BackHeader from '../components/common/BackHeader';
import CompactActionButton from '../components/common/CompactActionButton';
import CircleIconButton from '../components/common/CircleIconButton';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography } from '../theme/colors';
import {
  downloadWallpaperOnWeb,
  getOrDownloadWallpaper,
  isPermissionError,
  mapErrorToMessage,
  resolveWallpaperUri,
} from '../utils/wallpaperFile';
import {
  ensureGallerySavePermission,
  getGallerySavePermissionState,
  requestGallerySavePermission,
} from '../utils/mediaPermissions';
import {
  isNativeWallpaperAvailable,
  isLockScreenSupported,
  setNativeWallpaper,
} from '../native/WallpaperManager';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.faithframes.official';

export default function WallpaperDetailScreen({ route }) {
  const wallpaper = route?.params?.wallpaper || {};
  const wallpaperUri = resolveWallpaperUri(wallpaper);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { toggle, isFavorite } = useFavorites();
  const { isDark, colors, Shadows } = useTheme();

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const [wallpaperProgress, setWallpaperProgress] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const actionInProgress = useRef(false);
  const sharingInProgress = useRef(false);

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
  const openAppSettings = () => {
    Linking.openSettings().catch(() =>
      showToast('Open Settings → Apps → Faith Frames to allow storage access.', 'info', 5000)
    );
  };

  // Retry when the system dialog can still be shown; Settings when it was
  // permanently denied (Android will not show the dialog again).
  const showPermissionAlert = (canAskAgain) => {
    if (canAskAgain) {
      Alert.alert(
        'Storage access needed',
        'Faith Frames needs permission to save this wallpaper to your gallery.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Try again', onPress: () => handleDownload() },
        ]
      );
    } else {
      Alert.alert(
        'Storage access is turned off',
        'To save wallpapers, allow storage access for Faith Frames in your device Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: openAppSettings },
        ]
      );
    }
  };

  // Explains *why* before the system dialog appears, at the moment it is needed.
  const confirmStorageRationale = () =>
    new Promise((resolve) => {
      Alert.alert(
        'Save to your gallery',
        'To save this wallpaper, your device needs your permission to store the image in your gallery. Only this one image is saved; your other photos are never read.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continue', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });

  const handleDownload = async () => {
    if (actionInProgress.current || downloading || settingWallpaper || !wallpaperUri) return;
    actionInProgress.current = true;
    try {
      // expo-media-library does not exist in a browser, so this is not a
      // permission problem there: just hand the image to the browser.
      if (Platform.OS === 'web') {
        setDownloading(true);
        const outcome = await downloadWallpaperOnWeb(wallpaperUri, wallpaper.id);
        showToast(
          outcome === 'downloaded'
            ? 'Download started.'
            : 'Opened the image in a new tab. Save it from there.',
          'success'
        );
        return;
      }

      // Ask only when the OS requires it for this Android version, and only
      // if it can still be asked (never loop on a permanent denial).
      const permission = await getGallerySavePermissionState();
      if (permission.required && !permission.granted) {
        if (!permission.canAskAgain) {
          showPermissionAlert(false);
          return;
        }
        const proceed = await confirmStorageRationale();
        if (!proceed) return;
        const requested = await requestGallerySavePermission();
        if (!requested.granted) {
          showPermissionAlert(requested.canAskAgain);
          return;
        }
      }

      setDownloading(true);
      setDownloadProgress(0);

      const localUri = await getOrDownloadWallpaper(wallpaperUri, wallpaper.id, setDownloadProgress);
      await MediaLibrary.saveToLibraryAsync(localUri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Wallpaper saved to gallery!', 'success');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.warn('[Wallpaper] download failed:', err?.code || err?.message);
      if (isPermissionError(err)) {
        showPermissionAlert(false);
      } else {
        showToast(mapErrorToMessage(err), 'error');
      }
    } finally {
      actionInProgress.current = false;
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // ─── Share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (sharingInProgress.current || actionInProgress.current) return;
    sharingInProgress.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setSharing(true);
      const title =
        typeof wallpaper.title === 'string' && wallpaper.title.trim()
          ? wallpaper.title.trim()
          : 'Faith Frames Wallpaper';
      let imageUrl = '';

      if (wallpaperUri) {
        try {
          const parsedUri = new URL(wallpaperUri);
          if (parsedUri.protocol === 'https:' || parsedUri.protocol === 'http:') {
            imageUrl = parsedUri.toString();
          }
        } catch {
          // Omit malformed wallpaper links but still allow sharing the app listing.
        }
      }

      const details = [wallpaper.category, wallpaper.location, wallpaper.country]
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim());
      const message = [
        `Check out "${title}" on Faith Frames!`,
        details.length ? details.join(' · ') : '',
        imageUrl ? `View this wallpaper: ${imageUrl}` : '',
        `Get Faith Frames: ${PLAY_STORE_URL}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      await Share.share(
        { title, message },
        { dialogTitle: 'Share wallpaper' }
      );
    } catch {
      showToast('Could not open the sharing options. Please try again.', 'error');
    } finally {
      sharingInProgress.current = false;
      setSharing(false);
    }
  };

  // ─── Set as Wallpaper ─────────────────────────────────────────────────────
  const applyWallpaper = async (target) => {
    if (actionInProgress.current || !wallpaperUri) return;
    actionInProgress.current = true;
    try {
      setSettingWallpaper(true);
      setWallpaperProgress(0);

      const localUri = await getOrDownloadWallpaper(wallpaperUri, wallpaper.id, setWallpaperProgress);

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
        const canSave = await ensureGallerySavePermission();
        if (!canSave) {
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
      actionInProgress.current = false;
      setSettingWallpaper(false);
      setWallpaperProgress(0);
    }
  };

  const showSetWallpaperOptions = async () => {
    if (actionInProgress.current || settingWallpaper || downloading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // No wallpaper API exists in a browser; say so instead of a misleading
    // "update required" prompt (Alert.alert is also a no-op on web).
    if (Platform.OS === 'web') {
      showToast('Setting a wallpaper works in the Android app. Use Download to save this image.', 'info', 4500);
      return;
    }

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
          {wallpaperUri && !imageLoadError ? (
            <>
              <Image
                source={{ uri: wallpaperUri }}
                style={styles.image}
                contentFit="cover"
                transition={500}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                onError={() => setImageLoadError(true)}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
                style={styles.imageOverlay}
              />
            </>
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="image-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.imageFallbackText, { color: colors.textMuted }]}>
                Wallpaper image unavailable
              </Text>
            </View>
          )}
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
            disabled={downloading || !wallpaperUri}
            colors={colors.gradientPrimary}
            style={{ flex: 1 }}
          />
          <CompactActionButton
            title={downloading ? 'Saving' : 'Download'}
            icon="download-outline"
            onPress={handleDownload}
            loading={downloading}
            progress={downloading ? downloadProgress : undefined}
            disabled={settingWallpaper || !wallpaperUri}
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
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  imageFallbackText: {
    fontSize: Typography.fontSizeMD,
  },
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
