import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeTheme } from '../../theme/homeTheme';
import BackHeader from '../../components/common/BackHeader';
import useQuizProfile from '../../hooks/useQuizProfile';
import { achievementProgress } from '../../utils/achievements';

const H = HomeTheme;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, loading } = useQuizProfile();
  const items = achievementProgress(profile || {}) || [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="Achievements" transparent />

      {loading ? (
        <ActivityIndicator size="large" color={H.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, item.unlocked && styles.cardUnlocked]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: item.unlocked ? `${H.primary}22` : '#EDE8DC' },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={28}
                  color={item.unlocked ? H.primary : H.textMuted}
                />
              </View>
              <View style={styles.text}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.description}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${item.progress * 100}%` }]} />
                </View>
                <Text style={styles.progress}>
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
  root: { flex: 1, backgroundColor: H.bg },
  card: {
    flexDirection: 'row',
    backgroundColor: H.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    opacity: 0.85,
    ...H.shadow,
  },
  cardUnlocked: { opacity: 1, borderWidth: 1, borderColor: H.primary },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: H.text },
  desc: { fontSize: 13, color: H.textMuted, marginTop: 4, lineHeight: 18 },
  bar: {
    height: 6,
    backgroundColor: '#EDE8DC',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: H.primary },
  progress: { fontSize: 11, color: H.textMuted, marginTop: 4, fontWeight: '600' },
});
