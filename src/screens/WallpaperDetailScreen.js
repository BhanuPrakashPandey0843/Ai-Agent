import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  ScrollView,
  ActionSheetIOS,
  Platform,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';
import BackHeader from '../components/common/BackHeader';
import GradientButton from '../components/common/GradientButton';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography } from '../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function WallpaperDetailScreen({ route }) {
  const { wallpaper } = route.params;
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { toggle, isFavorite } = useFavorites();
  const [downloading, setDownloading] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const fav = isFavorite(wallpaper.id);
  const { isDark, colors, Shadows } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission needed to save wallpapers', 'error');
        return;
      }

      const filename = `faithframes_${wallpaper.id}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      const download = await FileSystem.downloadAsync(wallpaper.uri, fileUri);
      await MediaLibrary.saveToLibraryAsync(download.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Wallpaper saved to gallery!', 'success');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Download failed. Try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out "${wallpaper.title}" on Faith Frames!`,
        url: wallpaper.uri,
      });
    } catch {
      showToast('Could not share wallpaper', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    toggle(wallpaper.id);
  };

  const showSetWallpaperOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Set as Home Screen', 'Set as Lock Screen', 'Set Both'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) return;
          let target = 'both';
          if (buttonIndex === 1) target = 'home';
          if (buttonIndex === 2) target = 'lock';
          await setAsWallpaper(target);
        }
      );
    } else {
      Alert.alert(
        'Set as Wallpaper',
        'Choose where to set the wallpaper',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Home Screen', onPress: () => setAsWallpaper('home') },
          { text: 'Lock Screen', onPress: () => setAsWallpaper('lock') },
          { text: 'Both', onPress: () => setAsWallpaper('both') },
        ]
      );
    }
  };

  const setAsWallpaper = async (target) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setSettingWallpaper(true);
      showToast('Setting wallpaper...', 'info');

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission needed to set wallpaper', 'error');
        return;
      }

      const filename = `faithframes_temp_${wallpaper.id}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(wallpaper.uri, fileUri);
      
      // Save to gallery first so user can manually set if automatic not available
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Wallpaper saved! Check your gallery.', 'success');

    } catch (err) {
      console.error('Set wallpaper error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Failed to set wallpaper. Try again.', 'error');
    } finally {
      setSettingWallpaper(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar 
        barStyle="light-content" 
        translucent 
        backgroundColor="transparent" 
      />
      <BackHeader title="" transparent />

      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 200 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: wallpaper.uri }}
            style={[styles.image]}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
            style={styles.imageOverlay}
          />
        </View>

        <View style={[styles.infoSection, { padding: Spacing.xxxl }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary, fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightExtraBold }]}>
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
            <TouchableOpacity
              style={[styles.favBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, ...Shadows.card(isDark) }]}
              onPress={handleToggleFavorite}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons
                  name={fav ? 'heart' : 'heart-outline'}
                  size={28}
                  color={fav ? colors.primary : colors.textMuted}
                />
              </Animated.View>
            </TouchableOpacity>
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

      {/* Bottom actions */}
      <Animated.View style={[
        styles.actions,
        {
          paddingBottom: insets.bottom + Spacing.lg,
          backgroundColor: isDark ? 'rgba(5,5,10,0.98)' : 'rgba(255,255,255,0.98)',
          borderTopColor: colors.border,
          opacity: fadeAnim,
        }
      ]}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, ...Shadows.card(isDark) }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        
        <GradientButton
          title={settingWallpaper ? 'Setting...' : 'Set as Wallpaper'}
          onPress={showSetWallpaperOptions}
          loading={settingWallpaper}
          colors={colors.gradientPrimary}
          style={[styles.actionBtn, styles.actionBtnPrimary]}
        />
        
        <GradientButton
          title={downloading ? 'Saving...' : 'Download'}
          onPress={handleDownload}
          loading={downloading}
          colors={colors.gradientWallpaper}
          style={styles.actionBtn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_H * 0.70,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
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
    height: '50%',
  },
  infoSection: { },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    flex: 1,
    marginRight: Spacing.lg,
    lineHeight: 36,
  },
  favBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  badgeText: { },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  ratingText: { },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  locationText: { },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: { flex: 1 },
  actionBtnPrimary: {
    flex: 1.4,
  },
});
