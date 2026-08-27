import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';

function HeroBanner({ topInset = 0, title, subtitle }) {
  const theme = useReadingPlanTheme();
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={theme.heroGradient}
      style={[styles.hero, { paddingTop: topInset + 8 }]}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,28,22,0.06)' }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View entering={FadeIn.duration(500)} style={[styles.glow, theme.glow]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <MaterialCommunityIcons name="book-cross" size={36} color={theme.accent} />
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(80).duration(420)}
        style={[theme.type.heroTitle, { color: theme.textPrimary, textAlign: 'center' }]}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(140).duration(420)}
        style={[theme.type.bodySm, styles.sub, { color: theme.textSecondary }]}
      >
        {subtitle}
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  topBar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    marginBottom: 20,
    borderRadius: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
});

export default memo(HeroBanner);
