import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import { getBookById, getDailyDevotional, getGreeting, READING_PLANS } from '../../constants/bible';
import MiniAudioPlayer from '../../components/bible/MiniAudioPlayer';

export default function BibleHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useBibleTheme();
  const { user, userProfile } = useAuth();
  const {
    loading,
    dailyVerse,
    continueReading,
    streak,
    planProgress,
    loadAll,
    playChapterAudio,
    audio,
  } = useBible();

  const styles = useMemo(() => createStyles(theme), [theme]);
  const devotional = useMemo(() => getDailyDevotional(), []);
  const name = userProfile?.name || user?.displayName?.split(' ')[0] || 'Friend';
  const greeting = getGreeting();

  const continueBook = continueReading ? getBookById(continueReading.bookId) : null;

  const openReader = async (bookId, chapter, verse = 1) => {
    await Haptics.selectionAsync();
    navigation.navigate('BibleReader', { bookId, chapter, verse });
  };

  const shareVerse = async () => {
    const message = `"${dailyVerse.text}" — ${dailyVerse.reference}`;
    await Share.share({ message });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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

        <LinearGradient colors={theme.cardGradient} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <MaterialCommunityIcons name="book-cross" size={22} color={theme.primary} />
            <Text style={styles.heroLabel}>Verse of the Day</Text>
          </View>
          <Text style={styles.heroVerse}>"{dailyVerse.text}"</Text>
          <Text style={styles.heroRef}>{dailyVerse.reference}</Text>
          <View style={styles.heroActions}>
            <HeroAction icon="bookmark-outline" label="Save" onPress={() => openReader(dailyVerse.bookId, dailyVerse.chapter, dailyVerse.verse)} />
            <HeroAction icon="share-social-outline" label="Share" onPress={shareVerse} />
            <HeroAction icon="volume-high-outline" label="Listen" onPress={() => playChapterAudio(dailyVerse.bookId, dailyVerse.chapter)} />
          </View>
        </LinearGradient>

        {continueBook ? (
          <TouchableOpacity style={styles.continueCard} onPress={() => openReader(continueReading.bookId, continueReading.chapter, continueReading.verse)} activeOpacity={0.9}>
            <View style={styles.continueIcon}>
              <MaterialCommunityIcons name="book-open-page-variant" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueTitle}>Continue Reading</Text>
              <Text style={styles.continueSub}>{continueBook.name} {continueReading.chapter}:{continueReading.verse || 1}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.streakRow}>
          <StreakCard icon="fire" label="Reading" value={streak?.readingStreak || 0} best={streak?.bestReading || 0} theme={theme} />
          <StreakCard icon="headphones" label="Listening" value={streak?.listeningStreak || 0} best={streak?.bestListening || 0} theme={theme} />
        </View>

        <SectionHeader title="Daily Devotional" />
        <View style={styles.devotionalCard}>
          <Text style={styles.devotionalTheme}>{devotional.theme}</Text>
          <Text style={styles.devotionalExcerpt}>{devotional.excerpt}</Text>
          <View style={styles.devotionalMeta}>
            <Text style={styles.devotionalMetaText}>{devotional.duration} · {devotional.author}</Text>
            <TouchableOpacity style={styles.listenChip} onPress={() => openReader('ps', 23)}>
              <Ionicons name="play" size={14} color="#FFF" />
              <Text style={styles.listenChipText}>Read Psalm 23</Text>
            </TouchableOpacity>
          </View>
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
            <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => navigation.navigate('BiblePlans', { planId: plan.id })} activeOpacity={0.9}>
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

function HeroAction({ icon, label, onPress }) {
  const theme = useBibleTheme();
  return (
    <TouchableOpacity style={{ alignItems: 'center', gap: 4 }} onPress={onPress}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>{label}</Text>
    </TouchableOpacity>
  );
}

function StreakCard({ icon, label, value, best, theme }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: 14, ...theme.shadow }}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.accent} />
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, marginTop: 8 }}>{value}</Text>
      <Text style={{ fontSize: 12, color: theme.textMuted }}>{label} streak</Text>
      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>Best: {best}</Text>
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
    heroCard: { marginHorizontal: 20, borderRadius: 22, padding: 20, ...theme.shadow },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    heroLabel: { fontSize: 13, fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
    heroVerse: { fontSize: 18, lineHeight: 28, fontWeight: '600', color: theme.text, fontStyle: 'italic' },
    heroRef: { fontSize: 14, fontWeight: '700', color: theme.primary, marginTop: 10 },
    heroActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border },
    continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16, backgroundColor: theme.surface, borderRadius: 18, padding: 16, ...theme.shadow },
    continueIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: `${theme.primary}18`, alignItems: 'center', justifyContent: 'center' },
    continueTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    continueSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
    streakRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 },
    devotionalCard: { marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 18, padding: 18, ...theme.shadow },
    devotionalTheme: { fontSize: 17, fontWeight: '800', color: theme.text },
    devotionalExcerpt: { fontSize: 14, lineHeight: 22, color: theme.textMuted, marginTop: 8 },
    devotionalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    devotionalMetaText: { fontSize: 12, color: theme.textMuted },
    listenChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    listenChipText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
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
