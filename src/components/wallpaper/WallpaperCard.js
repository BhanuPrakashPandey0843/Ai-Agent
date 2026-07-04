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
import { Colors, Typography, BorderRadius, Spacing } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

const WallpaperCard = ({ item, index = 0, isFavorite = false, onFavoriteToggle }) => {
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { colors: themeColors } = useTheme();

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay: index * 80,
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

  const cardHeight = index % 3 === 0 ? 260 : 220;
  const [imageError, setImageError] = React.useState(false);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openDetail}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        {item.uri && !imageError ? (
          <Image
            source={{ uri: item.uri }}
            style={[styles.image, { height: cardHeight }]}
            contentFit="cover"
            transition={400}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback, { height: cardHeight }]}>
            <Ionicons name="image-outline" size={40} color="#D1D5DB" />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)']}
          style={[styles.gradient, { height: cardHeight }]}
        />

        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
          <Text style={styles.badgeText}>{item.category || 'Art'}</Text>
        </View>

        {/* Title */}
        <View style={styles.footer}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {item.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color={Colors.primary} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>

        {/* Favorite button */}
        {onFavoriteToggle && (
          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => onFavoriteToggle(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_W,
    margin: Spacing.xs,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  image: {
    width: '100%',
    borderRadius: BorderRadius.xl,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
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
    backdropFilter: 'blur(10px)',
  },
  badgeText: {
    color: Colors.white,
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
    color: Colors.white,
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
    color: Colors.primary,
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

export { CARD_W };
export default WallpaperCard;
