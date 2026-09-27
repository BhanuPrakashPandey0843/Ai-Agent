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
import { useBiblePremiumTheme } from '../../hooks/useBiblePremiumTheme';
import { getColors, BorderRadius } from '../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GoldenButton({
  label,
  onPress,
  icon = 'arrow-forward',
  disabled = false,
  compact = false,
}) {
  const theme = useBiblePremiumTheme();
  const colors = getColors(theme.isDark);
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
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.btn,
          { height: compact ? 44 : 52, borderRadius: BorderRadius.round },
          theme.shadowSoft,
        ]}
      >
        <Text style={[styles.label, { color: theme.onPrimary }]}>{label}</Text>
        {icon ? (
          <Animated.View style={arrowAnim}>
            <Ionicons name={icon} size={20} color={theme.onPrimary} />
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
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});

export default memo(GoldenButton);
