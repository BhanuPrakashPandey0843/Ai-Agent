import React, { useRef, useCallback } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRecyclingState } from '@shopify/flash-list';
import { Typography, BorderRadius, Spacing } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { resolveWallpaperUri } from '../../utils/wallpaperFile';

const DEFAULT_CARD_W = (Dimensions.get('window').width - Spacing.lg * 2 - Spacing.sm) / 2;

// Space between masonry cards (both axes). The list screen splits this in half
// around every cell so the gap between any two cards is exactly GRID_GAP.
export const GRID_GAP = 10;

// Remembers each image's natural aspect ratio so a card gets its final height
// immediately when it is recycled or scrolled back into view (no re-measure jump).
const aspectRatioCache = new Map();

const WallpaperCard = ({ item, index = 0, cardWidth = DEFAULT_CARD_W, isFavorite = false, onFavoriteToggle }) => {
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      // Cap the stagger: items on later pages have large indexes and must not
      // stay invisible for seconds.
      delay: (index % 8) * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  const openDetail = useCallback(() => {
    navigation.navigate('WallpaperDetail', { wallpaper: item });
  }, [item, navigation]);

  const imageUri = resolveWallpaperUri(item);
  // Per-item state must reset when FlashList recycles this cell for a different
  // wallpaper; plain useState would leak one item's error/height into the next.
  const [imageAspectRatio, setImageAspectRatio] = useRecyclingState(
    () => aspectRatioCache.get(imageUri) ?? null,
    [imageUri]
  );
  const cardHeight = imageAspectRatio
    ? Math.min(cardWidth * 1.85, Math.max(cardWidth * 0.55, cardWidth / imageAspectRatio))
    : cardWidth * (index % 3 === 0 ? 1.3 : 1.1);
  const [imageError, setImageError] = useRecyclingState(false, [imageUri]);
  const showImage = Boolean(imageUri) && !imageError;

  return (
    <Animated.View style={[styles.shadowWrap, { width: cardWidth, opacity, transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={openDetail}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        {showImage ? (
          <Image
            source={{ uri: imageUri }}
            recyclingKey={imageUri}
            style={[styles.image, { height: cardHeight }]}
            contentFit="cover"
            transition={400}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            cachePolicy="memory-disk"
            onLoad={({ source }) => {
              if (source?.width > 0 && source?.height > 0) {
                const ratio = source.width / source.height;
                aspectRatioCache.set(imageUri, ratio);
                setImageAspectRatio(ratio);
              }
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.imageFallback,
              { height: cardHeight, backgroundColor: colors.bgCardSoft },
            ]}
          >
            <Ionicons name="image-outline" size={34} color={colors.textMuted} />
            <Text style={[styles.fallbackTitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.title || 'Wallpaper'}
            </Text>
          </View>
        )}

        {showImage ? (
          <>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.78)']}
              style={[styles.gradient, { height: cardHeight }]}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category || 'Art'}</Text>
            </View>
            <View style={styles.footer}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              {item.rating ? (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={10} color="#FFFFFF" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {onFavoriteToggle && (
          <TouchableOpacity
            style={[
              styles.favBtn,
              { backgroundColor: showImage ? 'rgba(0,0,0,0.45)' : colors.bgCard },
            ]}
            onPress={() => onFavoriteToggle(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove wallpaper from favorites' : 'Add wallpaper to favorites'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? colors.primary : showImage ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: BorderRadius.xl,
  },
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  fallbackTitle: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightMedium,
    textAlign: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
  },
  favBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { DEFAULT_CARD_W as CARD_W };
export default WallpaperCard;
