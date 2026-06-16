// src/components/wallpaper/WallpaperCard.js — Animated masonry card
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

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

const WallpaperCard = ({ item, index = 0, isFavorite = false, onFavoriteToggle }) => {
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Staggered entrance
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const openDetail = useCallback(() => {
    navigation.navigate('WallpaperDetail', { wallpaper: item });
  }, [item, navigation]);

  // Vary card height for masonry feel
  const cardHeight = index % 3 === 0 ? 240 : 200;

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
            transition={300}
            placeholder={{ thumbhash: item.thumbhash }}
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
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={[styles.gradient, { height: cardHeight * 0.5 }]}
        />

        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) + '99' }]}>
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
              color={isFavorite ? Colors.error : Colors.white}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const getCategoryColor = (cat) => {
  const map = {
    Hindu: Colors.hindu,
    Islamic: Colors.islamic,
    Christian: Colors.christian,
    Sikh: Colors.sikh,
    Buddhist: Colors.buddhist,
  };
  return map[cat] || Colors.primary;
};

const styles = StyleSheet.create({
  container: {
    width: CARD_W,
    margin: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    borderRadius: BorderRadius.lg,
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
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    backdropFilter: 'blur(10px)',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  ratingText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { CARD_W };
export default WallpaperCard;
