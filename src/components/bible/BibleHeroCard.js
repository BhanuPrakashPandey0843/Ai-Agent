import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBiblePremiumTheme } from '../../hooks/useBiblePremiumTheme';

/**
 * Full-width premium card for the redesigned Bible destination screens
 * (e.g. Notes/Bookmarks entries, plan cards) — reusable anywhere a large
 * tappable "section entry" card is needed. NOT used on Bible Home.
 *
 * Art is built from layered gradients + a large translucent glyph rather
 * than a photo asset — the project has no licensed Bible/scroll/notebook
 * photography, so this keeps the same minimal/elegant/premium mood the
 * reference screens have without shipping a placeholder image.
 */
export default function BibleHeroCard({
  title,
  subtitle,
  icon = 'book-open-page-variant',
  glyph,
  gradient,
  onPress,
  index = 0,
  height = 170,
}) {
  const theme = useBiblePremiumTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 16, stiffness: 220 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const baseGradient = gradient || (theme.isDark
    ? ['#1C140E', '#141210', theme.surface]
    : ['#F8EDE0', '#FFF8F3', theme.surface]);

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 90).duration(420).springify().damping(16)}
      style={[styles.wrap, { height }, animatedStyle]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <LinearGradient
          colors={baseGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderRadius: theme.radius,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={glyph || icon}
            size={132}
            color={theme.isDark ? 'rgba(225,138,58,0.12)' : 'rgba(201,106,27,0.14)'}
            style={styles.glyph}
          />

          <LinearGradient
            colors={theme.overlayStrong}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View style={styles.iconBadge}>
            <MaterialCommunityIcons name={icon} size={20} color={theme.primary} />
          </Animated.View>

          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}

          <Animated.View style={[styles.arrowBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="arrow-forward" size={16} color={theme.onPrimary} />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 16,
  },
  pressable: { flex: 1 },
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  glyph: {
    position: 'absolute',
    right: -18,
    top: -14,
  },
  iconBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    marginTop: 5,
  },
  arrowBtn: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
