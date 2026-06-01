import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';
import { useToast } from '../context/ToastContext';
import useFavorites from '../hooks/useFavorites';
import BackHeader from '../components/common/BackHeader';
import GradientButton from '../components/common/GradientButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function WallpaperDetailScreen({ route }) {
  const { wallpaper } = route.params;
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { toggle, isFavorite } = useFavorites();
  const [downloading, setDownloading] = useState(false);
  const fav = isFavorite(wallpaper.id);

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

  return (
    <View style={styles.container}>
      <BackHeader title="" transparent />

      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
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

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{wallpaper.title}</Text>
            <TouchableOpacity
              style={styles.favBtn}
              onPress={() => toggle(wallpaper.id)}
            >
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={26}
                color={fav ? Colors.error : Colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            {wallpaper.category && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wallpaper.category}</Text>
              </View>
            )}
            {wallpaper.rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.primary} />
                <Text style={styles.ratingText}>{wallpaper.rating}</Text>
              </View>
            )}
          </View>

          {(wallpaper.country || wallpaper.location) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.locationText}>
                {[wallpaper.location, wallpaper.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <GradientButton
          title={downloading ? 'Saving...' : 'Download Wallpaper'}
          onPress={handleDownload}
          loading={downloading}
          colors={Colors.gradientGold}
          style={styles.downloadBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_H * 0.55,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
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
  infoSection: { padding: Spacing.xxxl },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    marginRight: Spacing.lg,
  },
  favBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.15)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  badge: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeMD,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.lg,
    backgroundColor: 'rgba(10,10,18,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.1)',
    gap: Spacing.md,
  },
  shareBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: { flex: 1 },
});
