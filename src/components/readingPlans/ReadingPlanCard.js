import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';
import ProgressRing from './ProgressRing';
import GoldenButton from './GoldenButton';

function ReadingPlanCard({ plan, meta, done, pct, index, onPress, onContinue }) {
  const theme = useReadingPlanTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const started = done > 0;
  const current = Math.min(done + 1, plan.days);

  return (
    <Animated.View entering={FadeInUp.delay(index * 90).duration(420).springify().damping(16)}>
      <Animated.View style={anim}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: theme.radius.card,
            },
            theme.shadow,
          ]}
        >
          <LinearGradient
            colors={[theme.accent, theme.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.strip}
          />

          <Pressable
            onPress={onPress}
            onPressIn={() => {
              scale.value = withSpring(0.985, { damping: 16, stiffness: 280 });
            }}
            onPressOut={() => {
              scale.value = withSpring(1, { damping: 14, stiffness: 240 });
            }}
          >
            <View style={styles.topRow}>
              <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
                <MaterialCommunityIcons
                  name={meta.icon || 'book-open-page-variant'}
                  size={28}
                  color={theme.accent}
                />
              </View>
              <View style={[styles.chip, { backgroundColor: theme.accentSoft }]}>
                <Text style={[theme.type.caption, { color: theme.accent }]}>{plan.days} DAYS</Text>
              </View>
            </View>

            <Text style={[theme.type.cardTitle, { color: theme.textPrimary, marginTop: 16 }]}>
              {plan.title}
            </Text>
            <Text style={[theme.type.bodySm, styles.desc, { color: theme.textSecondary }]}>
              {plan.subtitle}
            </Text>

            <View style={styles.progressRow}>
              <ProgressRing
                size={88}
                strokeWidth={8}
                progress={pct}
                color={theme.accent}
                trackColor={theme.accentSoft}
                label={`${pct}%`}
                labelColor={theme.textPrimary}
                sublabel={`Day ${started ? current : 0}`}
                sublabelColor={theme.textSecondary}
              />
              <View style={styles.progressCopy}>
                <Text style={[theme.type.body, { color: theme.textPrimary, fontWeight: '600' }]}>
                  {done} of {plan.days} days
                </Text>
                <Text style={[theme.type.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                  {started ? `${plan.days - done} remaining` : 'Ready when you are'}
                </Text>
                <View style={styles.miniMeta}>
                  <Ionicons name="time-outline" size={16} color={theme.accent} />
                  <Text style={[theme.type.caption, { color: theme.textSecondary }]}>
                    {meta.dailyTime || 'Daily reading'}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          <GoldenButton
            label={started ? 'Continue Reading' : 'Start Journey'}
            onPress={onContinue}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  desc: { marginTop: 8 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 20,
  },
  progressCopy: { flex: 1 },
  miniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
});

export default memo(ReadingPlanCard);
