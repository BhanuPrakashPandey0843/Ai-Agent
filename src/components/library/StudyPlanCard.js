import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

export default function StudyPlanCard({ item, index, accent, expanded, onPress }) {
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, delay: index * 45, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 45, useNativeDriver: true }),
    ]).start();
  }, [index, opacityAnim, scaleAnim]);

  useEffect(() => {
    Animated.spring(chevronAnim, { toValue: expanded ? 1 : 0, friction: 8, useNativeDriver: true }).start();
  }, [expanded, chevronAnim]);

  const pressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.97, friction: 9, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={0.92}
          style={styles.container}
        >
          <LinearGradient colors={Colors.gradientGlass} style={[styles.card, { borderColor: accent + '30' }]}>
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="memory-disk"
                />
              ) : (
                <LinearGradient colors={['#1A1A22', '#14141A']} style={styles.image}>
                  <Ionicons name="book-outline" size={34} color={accent} />
                </LinearGradient>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={styles.imageShade}
              />
              {item.duration ? (
                <View style={[styles.durationBadge, { backgroundColor: accent + 'E6' }]}>
                  <Ionicons name="time-outline" size={10} color={Colors.white} />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
                {item.description}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.readBtn,
                { backgroundColor: accent + '20', borderColor: accent + '45', transform: [{ rotate: chevronRotate }] },
              ]}
            >
              <Ionicons name="chevron-down" size={18} color={accent} />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  card: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  imageContainer: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  durationText: {
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  content: { flex: 1 },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    marginBottom: Spacing.xs,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  readBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
