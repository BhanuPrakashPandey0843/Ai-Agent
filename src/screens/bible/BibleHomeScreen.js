import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { getGreeting, READING_PLANS } from '../../constants/bible';
import MiniAudioPlayer from '../../components/bible/MiniAudioPlayer';

export default function BibleHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const { user, userProfile } = useAuth();
  const { loading, planProgress, loadAll, audio } = useBible();

  const styles = useMemo(() => createStyles(theme), [theme]);
  const name = userProfile?.name || user?.displayName?.split(' ')[0] || 'Friend';
  const greeting = getGreeting();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (audio.playing ? 160 : 120) }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAll} tintColor={theme.primary} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting}, {name}</Text>
            <Text style={styles.tagline}>Your lamp for today.</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('BibleSearch')}>
            <Ionicons name="search" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Explore Scripture" action="All Books" onAction={() => navigation.navigate('BibleBooks')} />
        <View style={styles.quickGrid}>
          <QuickTile icon="book-open-variant" label="Old Testament" color="#8B6914" onPress={() => navigation.navigate('BibleBooks', { testament: 'OT' })} theme={theme} />
          <QuickTile icon="book-cross" label="New Testament" color={theme.primary} onPress={() => navigation.navigate('BibleBooks', { testament: 'NT' })} theme={theme} />
          <QuickTile icon="bookmark" label="Bookmarks" color="#6B8F71" onPress={() => navigation.navigate('BibleBookmarks')} theme={theme} />
          <QuickTile icon="note-text" label="Notes" color="#7B6BA8" onPress={() => navigation.navigate('BibleNotes')} theme={theme} />
        </View>

        <SectionHeader title="Reading Plans" action="View All" onAction={() => navigation.navigate('BiblePlans')} />
        {READING_PLANS.map((plan) => {
          const progress = planProgress[plan.id];
          const done = progress?.completedDays?.length || 0;
          const pct = Math.round((done / plan.days) * 100);
          return (
            <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => navigation.navigate('ReadingPlanDetail', { planId: plan.id })} activeOpacity={0.9}>
              <View style={[styles.planDot, { backgroundColor: plan.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planSub}>{plan.subtitle}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: plan.color }]} />
                </View>
                <Text style={styles.planPct}>{pct}% complete · {plan.days} days</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <MiniAudioPlayer bottomInset={insets.bottom} />
    </View>
  );
}

function SectionHeader({ title, action, onAction }) {
  const theme = useBibleTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary }}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function QuickTile({ icon, label, color, onPress, theme }) {
  return (
    <TouchableOpacity style={{ width: '48%', backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 12, ...theme.shadow }} onPress={onPress} activeOpacity={0.88}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
    greeting: { fontSize: 24, fontWeight: '800', color: theme.text },
    tagline: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', ...theme.shadow },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    planCard: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 12, backgroundColor: theme.surface, borderRadius: 16, padding: 16, ...theme.shadow },
    planDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    planTitle: { fontSize: 15, fontWeight: '800', color: theme.text },
    planSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    progressTrack: { height: 6, backgroundColor: theme.border, borderRadius: 999, marginTop: 10, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 999 },
    planPct: { fontSize: 11, color: theme.textMuted, marginTop: 6 },
  });
}
