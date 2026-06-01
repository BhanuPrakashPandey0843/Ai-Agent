import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '../theme/colors';
import { STORAGE_KEYS } from '../constants';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const navigate = async () => {
      const onboarded = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
      setTimeout(() => {
        navigation.replace(onboarded === 'true' ? 'Login' : 'Onboarding');
      }, 2800);
    };
    navigate();
  }, [navigation]);

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <Animated.View
        style={[styles.glowOuter, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
      >
        <LinearGradient
          colors={['transparent', Colors.glow, 'transparent']}
          style={styles.glowRay}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
        </View>

        <Text style={styles.title}>Faith Frames</Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Premium Faith Wallpapers
        </Animated.Text>
        <Animated.View style={[styles.divider, { opacity: taglineOpacity }]}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
        <Text style={styles.footerText}>Loading your experience...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 0.5,
    top: height * 0.15,
    alignItems: 'center',
  },
  glowRay: {
    width: '100%',
    height: '100%',
    borderRadius: width,
  },
  content: { alignItems: 'center', zIndex: 2 },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.glow,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.borderAccent,
  },
  title: {
    fontSize: Typography.fontSize4XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.fontSizeMD,
    color: Colors.primaryLight,
    fontWeight: Typography.fontWeightMedium,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.borderAccent,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  footer: { position: 'absolute', bottom: 60 },
  footerText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeSM,
    letterSpacing: 1,
  },
});
