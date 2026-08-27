import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { useBible } from '../../context/BibleContext';
import { useReadingPlanTheme } from '../../hooks/useReadingPlanTheme';
import { READING_PLANS } from '../../constants/bible';
import { getPlanDays, getPlanWeeks, PLAN_META } from '../../constants/readingPlansData';
import ProgressRing from '../../components/readingPlans/ProgressRing';
import WeekAccordion from '../../components/readingPlans/WeekAccordion';
import DayTimelineCard from '../../components/readingPlans/DayTimelineCard';
import GoldenButton from '../../components/readingPlans/GoldenButton';
import CelebrationCard from '../../components/readingPlans/CelebrationCard';
import SectionHeader from '../../components/readingPlans/SectionHeader';

export default function ReadingPlanDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const theme = useReadingPlanTheme();
  const { planProgress, completePlanDay, streak, toggleBookmark, bookmarks } = useBible();

  const planId = route.params?.planId || '30_faith';
  const plan = useMemo(() => READING_PLANS.find((p) => p.id === planId) || READING_PLANS[0], [planId]);
  const meta = PLAN_META[planId] || PLAN_META['30_faith'];
  const days = useMemo(() => getPlanDays(planId), [planId]);
  const weeks = useMemo(() => getPlanWeeks(planId), [planId]);
  const richContent = planId === '30_faith';

  const progress = planProgress[planId];
  const completedDays = progress?.completedDays || [];
  const doneCount = completedDays.length;
  const currentDay = Math.min(doneCount + 1, plan.days);
  const pct = plan.days ? Math.round((doneCount / plan.days) * 100) : 0;
  const isComplete = doneCount >= plan.days;
  const todayData = days.find((d) => d.day === currentDay);

  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [dayCelebration, setDayCelebration] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const showPlanCelebration = isComplete && !celebrationDismissed && !dayCelebration;

  const styles = useMemo(() => createStyles(), []);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const heroFade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 90], [1, 0.35], Extrapolation.CLAMP),
  }));

  const verseBookmarkKey = todayData ? `${todayData.bookId}_${todayData.chapter}_0` : null;
  const isVerseBookmarked = bookmarks.some(
    (b) => b.key === verseBookmarkKey || b.reference === todayData?.scripture
  );

  const dayStatus = (day) => {
    if (completedDays.includes(day.day)) return 'completed';
    if (day.day === currentDay && !isComplete) return 'today';
    if (day.day > currentDay) return 'locked';
    return 'upcoming';
  };

  const openReader = useCallback(
    (day) => {
      if (!day) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('BibleReader', { bookId: day.bookId, chapter: day.chapter });
    },
    [navigation]
  );

  const markComplete = useCallback(
    (day) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completePlanDay(planId, day.day);
      setDayCelebration(day);
    },
    [completePlanDay, planId]
  );

  const openNotes = useCallback(
    (day) => {
      navigation.navigate('BibleNotes', {
        draft: {
          bookId: day.bookId,
          chapter: day.chapter,
          verse: 1,
          reference: day.scripture,
          text: day.title,
        },
      });
    },
    [navigation]
  );

  const sharePlan = useCallback(async () => {
    setMenuOpen(false);
    try {
      await Share.share({
        message: `I'm walking through ${plan.title} on Faith Frames — ${plan.days} days in Scripture.`,
      });
    } catch (_) {}
  }, [plan]);

  const bookmarkToday = useCallback(() => {
    if (!todayData) return;
    toggleBookmark({
      bookId: todayData.bookId,
      chapter: todayData.chapter,
      reference: todayData.scripture,
      text: todayData.title,
    });
  }, [todayData, toggleBookmark]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      <View style={[styles.sticky, { paddingTop: insets.top + 8, backgroundColor: theme.background }]}>
        <View style={styles.stickyRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.circleBtn, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
          </Pressable>

          <View style={styles.stickyTitles}>
            <Text style={[theme.type.caption, { color: theme.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
              {plan.title}
            </Text>
            <Text style={[theme.type.caption, { color: theme.accent }]}>{pct}% complete</Text>
          </View>

          <View style={styles.stickyActions}>
            <Pressable onPress={bookmarkToday} style={[styles.circleBtn, { backgroundColor: theme.surface }]}>
              <Ionicons
                name={isVerseBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={theme.accent}
              />
            </Pressable>
            <Pressable
              onPress={() => setMenuOpen(true)}
              style={[styles.circleBtn, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>
        <LinearGradient
          colors={[theme.accent, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        <Animated.View style={[styles.heroCopy, heroFade]}>
          <Text style={[theme.type.screenTitle, { color: theme.textPrimary }]}>{plan.title}</Text>
          <Text style={[theme.type.bodySm, { color: theme.textSecondary, marginTop: 8 }]}>{meta.tagline}</Text>
        </Animated.View>

        <View style={styles.content}>
          {showPlanCelebration ? (
            <CelebrationCard
              title="Plan Complete"
              body={`You've finished ${plan.title} — ${plan.days} days of faithful reading. Well done, good and faithful servant.`}
              scripture="Matthew 25:21"
              onContinue={() => setCelebrationDismissed(true)}
              onExplore={() => navigation.navigate('BiblePlans')}
            />
          ) : null}

          {dayCelebration ? (
            <CelebrationCard
              title="Day complete"
              body="Faithfulness in the small things becomes a life with God. See you tomorrow."
              scripture={dayCelebration.scripture}
              onContinue={() => setDayCelebration(null)}
            />
          ) : null}

          <Animated.View
            entering={FadeInUp.delay(60).duration(400)}
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderRadius: theme.radius.card,
              },
              theme.shadow,
            ]}
          >
            <View style={styles.progressRow}>
              <ProgressRing
                size={112}
                strokeWidth={9}
                progress={pct}
                color={theme.accent}
                trackColor={theme.accentSoft}
                label={`${pct}%`}
                labelColor={theme.textPrimary}
                sublabel={`${doneCount}/${plan.days}`}
                sublabelColor={theme.textSecondary}
              />
              <View style={styles.progressStats}>
                <Text style={[theme.type.caption, { color: theme.accent }]}>CURRENT DAY</Text>
                <Text style={[theme.type.cardTitle, { color: theme.textPrimary }]}>
                  {isComplete ? plan.days : currentDay}
                </Text>
                <Text style={[theme.type.bodySm, { color: theme.textSecondary, marginTop: 8 }]}>
                  {isComplete ? 'Journey complete' : `${plan.days - doneCount} days remaining`}
                </Text>
                <Text style={[theme.type.caption, { color: theme.textSecondary, marginTop: 8 }]}>
                  {streak?.readingStreak || 0} day streak
                </Text>
              </View>
            </View>
            <GoldenButton
              label={isComplete ? 'Plan Complete' : doneCount > 0 ? `Continue · Day ${currentDay}` : 'Start Reading Plan'}
              onPress={() => (isComplete ? null : openReader(todayData))}
              disabled={isComplete}
              icon={isComplete ? 'checkmark' : 'arrow-forward'}
            />
          </Animated.View>

          <SectionHeader title="Journey Timeline" subtitle="Walk through each day at a peaceful pace." />
          <WeekAccordion
            weeks={weeks}
            currentDay={currentDay}
            defaultOpenWeek={Math.floor((currentDay - 1) / 7) + 1}
            renderDay={(day) => (
              <DayTimelineCard
                key={day.day}
                day={day}
                status={dayStatus(day)}
                richContent={richContent}
                onRead={openReader}
                onComplete={markComplete}
                onNotes={openNotes}
              />
            )}
          />
        </View>
      </Animated.ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable style={styles.menuItem} onPress={sharePlan}>
              <Ionicons name="share-outline" size={20} color={theme.accent} />
              <Text style={[theme.type.body, { color: theme.textPrimary }]}>Share plan</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                bookmarkToday();
              }}
            >
              <Ionicons name="bookmark-outline" size={20} color={theme.accent} />
              <Text style={[theme.type.body, { color: theme.textPrimary }]}>Bookmark today's reading</Text>
            </Pressable>
            {todayData ? (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  openNotes(todayData);
                }}
              >
                <Ionicons name="create-outline" size={20} color={theme.accent} />
                <Text style={[theme.type.body, { color: theme.textPrimary }]}>Write a reflection</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1 },
    sticky: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      zIndex: 20,
    },
    stickyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stickyTitles: { flex: 1, alignItems: 'center' },
    stickyActions: { flexDirection: 'row', gap: 8 },
    circleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: { height: 2, borderRadius: 2, marginTop: 12, width: '42%' },
    heroCopy: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    heroCard: {
      borderWidth: 1,
      padding: 20,
      marginBottom: 24,
    },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
    progressStats: { flex: 1 },
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
      padding: 20,
      paddingBottom: 40,
    },
    menu: {
      borderRadius: 24,
      borderWidth: 1,
      paddingVertical: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
  });
}
