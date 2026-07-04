import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

function formatSessionDate(createdAt) {
  if (!createdAt) return 'Recently added';
  const ms = createdAt?.toMillis?.() ?? createdAt?.seconds * 1000;
  if (!ms) return 'Recently added';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MeetSessionCard({ item, index, accent, onJoinError }) {
  const { colors } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const [joining, setJoining] = React.useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, delay: index * 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const handleJoin = async () => {
    const url = item.meetLink?.trim();
    if (!url) {
      onJoinError?.('Meeting link is unavailable.');
      return;
    }
    try {
      setJoining(true);
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        onJoinError?.('This meeting link cannot be opened on your device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      onJoinError?.('Failed to open the meeting link.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Animated.View style={[styles.wrap, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
        <View style={[styles.iconCircle, { backgroundColor: accent + '18', borderColor: accent + '35' }]}>
          <Ionicons name="videocam" size={22} color={accent} />
        </View>

        <Text style={[styles.message, { color: colors.textPrimary }]}>{item.message}</Text>

        <Text style={[styles.linkPreview, { color: colors.textMuted }]} numberOfLines={1}>
          {item.meetLink}
        </Text>

        <Text style={[styles.date, { color: colors.textMuted }]}>{formatSessionDate(item.createdAt)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="thumbs-up-outline" size={14} color={colors.success} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.likes ?? 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="thumbs-down-outline" size={14} color={colors.error} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.dislikes ?? 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleJoin}
          activeOpacity={0.85}
          disabled={joining}
          style={styles.joinWrap}
        >
          <LinearGradient
            colors={[accent, accent + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.joinBtn}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="enter-outline" size={18} color="#FFFFFF" />
                <Text style={styles.joinText}>Join Meeting</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  card: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    marginBottom: Spacing.sm,
    lineHeight: 28,
  },
  linkPreview: {
    fontSize: Typography.fontSizeSM,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.fontSizeXS,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  joinWrap: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  joinText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: '#FFFFFF',
  },
});
