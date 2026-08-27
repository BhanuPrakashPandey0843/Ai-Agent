import React, { memo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GoldenButton({
  label,
  onPress,
  icon = 'arrow-forward',
  disabled = false,
  compact = false,
}) {
  const theme = useReadingPlanTheme();
  const scale = useSharedValue(1);
  const arrowX = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.55 : 1,
  }));
  const arrowAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
        arrowX.value = withTiming(4, { duration: 160 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
        arrowX.value = withTiming(0, { duration: 180 });
      }}
      style={[anim, compact ? styles.compactWrap : styles.wrap]}
    >
      <LinearGradient
        colors={[theme.accent, theme.accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.btn,
          { height: compact ? 44 : 52, borderRadius: theme.radius.button },
          theme.shadowSoft,
        ]}
      >
        <Text style={[theme.type.button, styles.label, { color: theme.onAccent }]}>{label}</Text>
        {icon ? (
          <Animated.View style={arrowAnim}>
            <Ionicons name={icon} size={20} color={theme.onAccent} />
          </Animated.View>
        ) : null}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  compactWrap: { alignSelf: 'stretch' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  label: { letterSpacing: 0.2 },
});

export default memo(GoldenButton);
