import React, { useState } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';
import BackHeader from '../components/common/BackHeader';
import GradientButton from '../components/common/GradientButton';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function WallpaperDetailScreen({ route }) {
  const { wallpaper } = route.params;
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { toggle, isFavorite } = useFavorites();
  const [downloading, setDownloading] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const fav = isFavorite(wallpaper.id);
  const { isDark, colors, Typography, Spacing } = useTheme();

  const handleDownload = async () => {
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
      showToast('Wallpaper saved to gallery!', 'success');
    } catch (err) {
      showToast('Download failed. Try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${wallpaper.title}" on Faith Frames!`,
        url: wallpaper.uri,
      });
    } catch {
      showToast('Could not share wallpaper', 'error');
    }
  };

  const showSetWallpaperOptions = () => {
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
    try {
      setSettingWallpaper(true);
      showToast('Setting wallpaper...', 'info');
      
      // First, download the file locally
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission needed to set wallpaper', 'error');
        return;
      }

      const filename = `faithframes_temp_${wallpaper.id}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.downloadAsync(wallpaper.uri, fileUri);

      // For now, since expo-wallpaper might not be installed, we'll show a message
      // In production, you would use expo-wallpaper or a native module
      showToast('Wallpaper downloaded! Please set it manually from your gallery.', 'info');
      
      // To use expo-wallpaper, uncomment the code below and install the package:
      // import * as Wallpaper from 'expo-wallpaper';
      // await Wallpaper.setWallpaperAsync(fileUri, target);
      // showToast('Wallpaper set successfully!', 'success');
      
    } catch (err) {
      console.error('Set wallpaper error:', err);
      showToast('Failed to set wallpaper. Try again.', 'error');
    } finally {
      setSettingWallpaper(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <BackHeader title="" transparent />

      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: wallpaper.uri }}
            style={styles.image}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
        </View>

        <View style={[styles.infoSection, { padding: Spacing.xxxl }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold }]}>
              {wallpaper.title}
            </Text>
            <TouchableOpacity
              style={[styles.favBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => toggle(wallpaper.id)}
            >
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={26}
                color={fav ? colors.error : colors.textPrimary}
              />
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

          {(wallpaper.country || wallpaper.location) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.locationText, { color: colors.textMuted, fontSize: Typography.fontSizeMD }]}>
                {[wallpaper.location, wallpaper.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[
        styles.actions,
        {
          paddingBottom: insets.bottom + Spacing.lg,
          backgroundColor: isDark ? 'rgba(5,5,10,0.98)' : 'rgba(248,249,255,0.98)',
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        
        <GradientButton
          title={settingWallpaper ? 'Setting...' : 'Set as Wallpaper'}
          onPress={showSetWallpaperOptions}
          loading={settingWallpaper}
          colors={colors.gradientWallpaper}
          style={styles.actionBtn}
        />
        
        <GradientButton
          title={downloading ? 'Saving...' : 'Download'}
          onPress={handleDownload}
          loading={downloading}
          colors={colors.gradientPrimary}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_H * 0.55,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  infoSection: { },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    marginRight: 16,
  },
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: { },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: { flex: 1 },
});
