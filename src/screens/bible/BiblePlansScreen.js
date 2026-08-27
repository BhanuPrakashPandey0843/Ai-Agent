import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useBible } from '../../context/BibleContext';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';
import { READING_PLANS, getDailyVerse } from '../../constants/bible';
import { PLAN_META } from '../../constants/readingPlansData';
import HeroBanner from '../../components/readingPlans/HeroBanner';
import ReadingPlanCard from '../../components/readingPlans/ReadingPlanCard';
import StatsCard from '../../components/readingPlans/StatsCard';
import SectionHeader from '../../components/readingPlans/SectionHeader';
import VersePreviewCard from '../../components/readingPlans/VersePreviewCard';

function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function BiblePlansScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useReadingPlanTheme();
  const { planProgress, streak, bookmarks, toggleBookmark } = useBible();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const verse = useMemo(() => getDailyVerse(), []);

  const totals = useMemo(() => {
    const daysCompleted = Object.values(planProgress || {}).reduce(
      (sum, p) => sum + (p?.completedDays?.length || 0),
      0
    );
    return {
      streak: streak?.readingStreak || 0,
      daysCompleted,
      timeLabel: formatMinutes(daysCompleted * 8),
    };
  }, [planProgress, streak]);

  const verseKey = `${verse.bookId}_${verse.chapter}_${verse.verse ?? 0}`;
  const isBookmarked = bookmarks.some((b) => b.key === verseKey || b.reference === verse.reference);

  const openPlan = (planId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ReadingPlanDetail', { planId });
  };

  const shareVerse = async () => {
    try {
      await Share.share({
        message: `"${verse.text}"\n— ${verse.reference}\n\nShared via Faith Frames`,
      });
    } catch (_) {}
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <HeroBanner
          topInset={insets.top}
          title="Daily Reading Plans"
          subtitle="Grow closer to God every day through guided scripture journeys."
        />

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <StatsCard icon="flame-outline" label="Current Streak" value={`${totals.streak}`} />
            <StatsCard icon="checkmark-circle-outline" label="Days Completed" value={`${totals.daysCompleted}`} />
            <StatsCard icon="time-outline" label="Time with God" value={totals.timeLabel} />
          </View>

          <SectionHeader title="Choose a journey" subtitle="Three paths. One faithful rhythm." />

          {READING_PLANS.map((plan, index) => {
            const meta = PLAN_META[plan.id] || {};
            const progress = planProgress[plan.id];
            const done = progress?.completedDays?.length || 0;
            const pct = plan.days ? Math.round((done / plan.days) * 100) : 0;
            return (
              <ReadingPlanCard
                key={plan.id}
                plan={plan}
                meta={meta}
                done={done}
                pct={pct}
                index={index}
                onPress={() => openPlan(plan.id)}
                onContinue={() => openPlan(plan.id)}
              />
            );
          })}

          <SectionHeader title="Today's Verse" />
          <VersePreviewCard
            text={verse.text}
            reference={verse.reference}
            bookmarked={isBookmarked}
            onBookmark={() =>
              toggleBookmark({
                bookId: verse.bookId,
                chapter: verse.chapter,
                verse: verse.verse,
                reference: verse.reference,
                text: verse.text,
              })
            }
            onShare={shareVerse}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1 },
    body: { paddingHorizontal: 20, paddingTop: 24 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  });
}
