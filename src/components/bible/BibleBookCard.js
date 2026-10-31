import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BibleBookCover from './BibleBookCover';

export default function BibleBookCard({ language, index, theme, disabled, onOpen }) {
  const reduceMotion = useReducedMotion();
  const opening = useSharedValue(0);
  const coverStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${-8 - opening.value * 100}deg` },
    ],
  }));

  const open = () => {
    if (disabled) return;
    if (reduceMotion) {
      onOpen(language.id);
      return;
    }
    opening.value = withTiming(1, { duration: 480 }, (finished) => {
      if (finished) runOnJS(onOpen)(language.id);
    });
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(index * 100).duration(380)}
      style={styles.flex}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${language.title}, ${language.nativeTitle}`}
        accessibilityHint="Opens the language Bible reader"
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: disabled ? 0.65 : 1,
            transform: [{ scale: pressed && !reduceMotion ? 0.98 : 1 }],
          },
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.isDark ? 0.2 : 0.04,
            shadowRadius: 5,
            elevation: 2,
          },
        ]}
      >
        <View style={styles.artwork}>
          <BibleBookCover language={language} animatedStyle={coverStyle} />
        </View>
        <Text style={[styles.languageName, { color: theme.text }]} numberOfLines={2}>
          {language.nativeTitle}
        </Text>
        <Text style={[styles.languageEnglish, { color: theme.textMuted }]}>
          {language.title}
        </Text>
        <View style={styles.actionRow}>
          <Text style={[styles.actionLabel, { color: theme.primary }]}>Read Bible</Text>
          <Ionicons name="arrow-forward" size={15} color={theme.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: {
    minHeight: 238,
    padding: 9,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  artwork: {
    height: 152,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 4,
  },
  languageName: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  languageEnglish: {
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
    minHeight: 24,
  },
  actionLabel: { fontSize: 12, fontWeight: '700' },
});
