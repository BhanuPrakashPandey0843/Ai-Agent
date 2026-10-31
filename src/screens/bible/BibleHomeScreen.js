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
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { READING_PLANS } from '../../constants/bible';
import MiniAudioPlayer from '../../components/bible/MiniAudioPlayer';
import LanguageBibleSection from '../../components/bible/LanguageBibleSection';

export default function BibleHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const { loading, planProgress, loadAll, audio } = useBible();

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (audio.playing ? 160 : 120) }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAll} tintColor={theme.primary} />
        }
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Search the Bible"
          activeOpacity={0.8}
          style={styles.searchBar}
          onPress={() => navigation.navigate('BibleSearch')}
        >
          <Ionicons name="search" size={19} color={theme.textMuted} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search books, chapters, or verses
          </Text>
        </TouchableOpacity>

        <SectionHeader title="Explore Scripture" action="All Books" onAction={() => navigation.navigate('BibleBooks')} />
        <View style={styles.quickGrid}>
          <QuickTile icon="book-open-variant" label="Old Testament" onPress={() => navigation.navigate('BibleBooks', { testament: 'OT' })} theme={theme} />
          <QuickTile icon="book-cross" label="New Testament" onPress={() => navigation.navigate('BibleBooks', { testament: 'NT' })} theme={theme} />
          <QuickTile icon="bookmark" label="Bookmarks" onPress={() => navigation.navigate('BibleBookmarks')} theme={theme} />
          <QuickTile icon="note-text" label="Notes" onPress={() => navigation.navigate('BibleNotes')} theme={theme} />
        </View>

        <LanguageBibleSection />

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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary }}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function QuickTile({ icon, label, onPress, theme }) {
  const orange = theme.primary;
  return (
    <TouchableOpacity
      style={{
        width: '48%',
        backgroundColor: theme.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.border,
        ...cardShadow(theme.isDark),
      }}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: theme.isDark ? 'rgba(225,138,58,0.16)' : 'rgba(201,106,27,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <MaterialCommunityIcons name={icon} size={20} color={orange} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    searchBar: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 20,
      marginTop: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      backgroundColor: theme.surface,
      ...cardShadow(theme.isDark),
    },
    searchPlaceholder: { flex: 1, fontSize: 14, color: theme.textMuted },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    planCard: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 10, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 14, padding: 14, ...cardShadow(theme.isDark) },
    planDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    planTitle: { fontSize: 15, fontWeight: '800', color: theme.text },
    planSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    progressTrack: { height: 6, backgroundColor: theme.border, borderRadius: 999, marginTop: 10, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 999 },
    planPct: { fontSize: 11, color: theme.textMuted, marginTop: 6 },
  });
}

function cardShadow(isDark) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 5,
    elevation: 2,
  };
}
