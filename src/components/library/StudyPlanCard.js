import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/colors';

export default function StudyPlanCard({ item, index, accent, expanded, onPress }) {
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, delay: index * 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, [index, opacityAnim, scaleAnim]);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
        <LinearGradient colors={Colors.gradientGlass} style={styles.card}>
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
                <Ionicons name="book-outline" size={36} color={accent} />
              </LinearGradient>
            )}
            {item.duration ? (
              <View style={[styles.durationBadge, { backgroundColor: accent + 'CC' }]}>
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

          <View style={[styles.readBtn, { backgroundColor: accent + '20', borderColor: accent + '45' }]}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={accent} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  card: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  durationText: {
    fontSize: 9,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  content: { flex: 1 },
  title: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.white,
    marginBottom: Spacing.xs,
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
