import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/colors';
import { WELCOME_SLIDES } from '../constants';
import { setOnboardingDone } from '../storage';
import GradientButton from '../components/common/GradientButton';

const { width, height } = Dimensions.get('window');
const AUTO_SLIDE_MS = 4500;

function WelcomeSlide({ item, index, scrollX }) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.12, 1, 1.12],
    extrapolate: 'clamp',
  });
  const contentOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });
  const contentTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [24, 0, -24],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: imageScale }] }]}>
        <ExpoImage source={item.image} style={styles.bgImage} contentFit="cover" transition={400} />
      </Animated.View>

      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.55)', 'rgba(10,10,10,0.95)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.slideContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
        </View>
        <Text style={styles.tagline}>{item.tagline}</Text>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDesc}>{item.description}</Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimer = useRef(null);

  const finish = useCallback(async () => {
    await setOnboardingDone();
    navigation.replace('Login');
  }, [navigation]);

  const goToIndex = useCallback((index) => {
    if (index >= WELCOME_SLIDES.length) {
      finish();
      return;
    }
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  }, [finish]);

  useEffect(() => {
    autoTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= WELCOME_SLIDES.length) {
          flatListRef.current?.scrollToIndex({ index: 0, animated: true });
          return 0;
        }
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SLIDE_MS);
    return () => clearInterval(autoTimer.current);
  }, []);

  const resetAutoTimer = () => {
    clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % WELCOME_SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SLIDE_MS);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]?.index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const isLast = currentIndex === WELCOME_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + Spacing.md }]}
        onPress={finish}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={WELCOME_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }, 100);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={resetAutoTimer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <WelcomeSlide item={item} index={index} scrollX={scrollX} />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <View style={styles.pagination}>
          {WELCOME_SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <GradientButton
          title={isLast ? 'Get Started' : 'Continue'}
          onPress={() => (isLast ? finish() : goToIndex(currentIndex + 1))}
          colors={Colors.gradientPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  skipBtn: {
    position: 'absolute',
    right: Spacing.xxl,
    zIndex: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  slide: { width, height },
  bgImage: { width, height },
  slideContent: {
    position: 'absolute',
    bottom: height * 0.22,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.borderAccent,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  logo: { width: '100%', height: '100%' },
  tagline: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primaryLight,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  slideTitle: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDesc: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeightMD,
    maxWidth: 320,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xxxl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
