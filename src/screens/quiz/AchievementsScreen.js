import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import BackHeader from '../../components/common/BackHeader';
import useQuizProfile from '../../hooks/useQuizProfile';
import { achievementProgress } from '../../utils/achievements';

export default function AchievementsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, loading } = useQuizProfile();
  const items = achievementProgress(profile || {}) || [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <BackHeader title="Achievements" transparent />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: colors.bgCard }, item.unlocked && { borderWidth: 1, borderColor: colors.primary, opacity: 1 }]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: item.unlocked ? `${colors.primary}22` : (isDark ? '#1A1A33' : '#EDE8DC') },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={28}
                  color={item.unlocked ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.desc, { color: colors.textMuted }]}>{item.description}</Text>
                <View style={[styles.bar, { backgroundColor: isDark ? '#1A1A33' : '#EDE8DC' }]}>
                  <View style={[styles.barFill, { width: `${item.progress * 100}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.progress, { color: colors.textMuted }]}>
                  {item.unlocked ? 'Unlocked' : `${Math.min(item.current, item.target)} / ${item.target}`}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    opacity: 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  bar: {
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
  progress: { fontSize: 11, marginTop: 4, fontWeight: '600' },
});
