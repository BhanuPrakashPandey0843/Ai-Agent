// src/components/common/SkeletonLoader.js — Shimmer skeleton placeholder
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius } from '../../theme/colors';

const SkeletonLoader = ({ width = '100%', height = 200, borderRadius = BorderRadius.lg, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

export const WallpaperCardSkeleton = () => (
  <View style={styles.cardSkeleton}>
    <SkeletonLoader height={180} borderRadius={16} />
    <SkeletonLoader width="70%" height={14} borderRadius={8} style={{ marginTop: 10 }} />
    <SkeletonLoader width="40%" height={11} borderRadius={8} style={{ marginTop: 6 }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.bgCardLight,
  },
  cardSkeleton: {
    flex: 1,
    margin: 6,
    padding: 4,
  },
});

export default SkeletonLoader;
