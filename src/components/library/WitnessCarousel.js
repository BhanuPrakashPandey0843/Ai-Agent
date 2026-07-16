// src/components/library/WitnessCarousel.js
// Premium auto-scrolling hero carousel for the Witness Videos screen.
// Content (image/title/subtitle/order/active) is fully admin-controlled via
// witnessCarousel — see subscribeToWitnessCarousel in firebaseService.
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - Spacing.xl * 2;
const CARD_H = Math.round(CARD_W * 0.55);
const AUTO_SLIDE_MS = 4500;

export default function WitnessCarousel({ banners }) {
  const { colors } = useTheme();
  const listRef = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const count = banners?.length || 0;

  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % count;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      indexRef.current = next;
      setActiveIndex(next);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [count]);

  const onMomentumScrollEnd = useCallback((e) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + Spacing.md));
    indexRef.current = next;
    setActiveIndex(next);
  }, []);

  const getItemLayout = useCallback(
    (_, index) => ({ length: CARD_W + Spacing.md, offset: (CARD_W + Spacing.md) * index, index }),
    []
  );

  const onScrollToIndexFailed = useCallback((info) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: false });
    }, 50);
  }, []);

  if (!count) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_W + Spacing.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
        renderItem={({ item }) => {
          const hasImage = item.image && !imageErrors[item.id];
          return (
            <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
              {hasImage ? (
                <Image
                  source={{ uri: item.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={350}
                  cachePolicy="memory-disk"
                  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
                />
              ) : (
                <LinearGradient
                  colors={colors.gradientWitness || ['#B45309', '#F59E0B']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.textWrap}>
                {item.title ? (
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                ) : null}
                {item.subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {count > 1 ? (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View
              key={b.id}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.xl },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  textWrap: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    lineHeight: 28,
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
