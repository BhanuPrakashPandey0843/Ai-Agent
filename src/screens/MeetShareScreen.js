// src/screens/MeetShareScreen.js
// "Live Worship Room" — Firestore: meetSessions (source of truth: admin panel
// at /admin/uploads/upload-meet). Shows EVERY currently-relevant meeting —
// all live sessions, then all upcoming ones — not just a single featured
// card, so every meeting link the admin schedules actually shows up here.
// Real-time updates, copy-link, join-meeting, and per-user RSVP (going /
// not going) work independently per meeting.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import {
  subscribeToLiveWorshipMeetings,
  getFirestoreErrorMessage,
  getUserRsvpResponse,
  setUserRsvpResponse,
  fetchRsvpCounts,
} from '../services/firebaseService';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../theme/colors';

// This section's brand color. Now aligned with the app's real orange design
// system (same hex as `Colors.primary` / the Bible & Verse sections) instead
// of the previous unrelated cyan/blue tone, so this screen matches the rest
// of Faith Frames. Gradients below use `colors.gradientPrimary` (the same
// gradient used by primary buttons app-wide) instead of the old blue-toned
// `gradientMeet`.
const ACCENT = '#C96A1B';

const STATUS_META = {
  live: { label: 'LIVE', color: '#EF4444' },
  upcoming: { label: 'UPCOMING', color: ACCENT },
  ended: { label: 'ENDED', color: '#6B7280' },
};

function isLikelyUrl(value) {
  if (!value) return false;
  try {
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`;
    // eslint-disable-next-line no-new
    new URL(withScheme);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(value) {
  if (!value) return '';
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`;
}

// ─── Single meeting card ────────────────────────────────────────────────────
function WorshipMeetingCard({
  meeting,
  colors,
  isDark,
  extras,
  busyKey,
  onRsvp,
  onJoin,
  onCopy,
  onImageError,
  imageErrored,
}) {
  const status = STATUS_META[meeting.status] || STATUS_META.upcoming;
  const hasVerse = Boolean(meeting.verseText);
  const hasImage = Boolean(meeting.imageUrl) && !imageErrored;
  const joinDisabled = meeting.status === 'ended' || !meeting.meetLink;
  const counts = extras?.counts || { going: 0, notGoing: 0 };
  const myResponse = extras?.myResponse ?? null;
  const isJoining = busyKey === `${meeting.id}-join`;
  const isCopying = busyKey === `${meeting.id}-copy`;
  const isRsvpBusy = typeof busyKey === 'string' && busyKey.startsWith(`${meeting.id}-rsvp`);

  return (
    <LinearGradient
      colors={colors.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardBorder}
    >
      <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
        {/* Banner image with title overlaid */}
        <View style={styles.bannerWrap}>
          {hasImage ? (
            <Image
              source={{ uri: meeting.imageUrl }}
              style={styles.banner}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              onError={() => onImageError(meeting.id)}
            />
          ) : (
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <Ionicons name="videocam" size={56} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(4,4,8,0.75)', 'rgba(4,4,8,0.98)']}
            locations={[0, 0.35, 0.7, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.bannerBadgeRow}>
            <View style={[styles.videoIconCircle, { backgroundColor: ACCENT + 'D9' }]}>
              <Ionicons name="videocam" size={18} color="#FFFFFF" />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              {meeting.status === 'live' && <View style={styles.liveDot} />}
              <Text style={styles.statusBadgeText}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.bannerTitleWrap}>
            <Text style={styles.overlayTitle} numberOfLines={2}>
              {meeting.title}
            </Text>
            {!!meeting.subtitle && (
              <Text style={[styles.overlaySubtitle, { color: ACCENT }]} numberOfLines={1}>
                {meeting.subtitle}
              </Text>
            )}
            <View style={styles.titleDivider} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {hasVerse && (
            <View style={styles.verseRow}>
              <Text style={[styles.quoteMark, { color: ACCENT }]}>&#8220;</Text>
              <Text style={[styles.verseText, { color: colors.textSecondary }]}>
                {meeting.verseText}
                {!!meeting.verseReference && (
                  <Text style={{ color: ACCENT, fontWeight: '700' }}> — {meeting.verseReference}</Text>
                )}
              </Text>
            </View>
          )}

          <View style={[styles.infoBox, { backgroundColor: colors.bgCardSoft, borderColor: colors.border }]}>
            {!!(meeting.dateLabel || meeting.timeLabel) && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.infoIcon, { backgroundColor: ACCENT + '22' }]}>
                  <Ionicons name="calendar" size={18} color={ACCENT} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Date &amp; Time</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                    {[meeting.dateLabel, meeting.timeLabel].filter(Boolean).join('  \u2022  ')}
                  </Text>
                </View>
              </View>
            )}

            {!!meeting.meetLink && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: ACCENT + '22' }]}>
                  <Ionicons name="link" size={18} color={ACCENT} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                    {meeting.platform || 'Meeting Link'}
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                    {meeting.meetLink}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onCopy(meeting)}
                  disabled={isCopying}
                  style={styles.copyBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="copy-outline" size={20} color={ACCENT} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* RSVP */}
          <View style={[styles.rsvpRow, { backgroundColor: colors.bgCardSoft, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.rsvpItem}
              onPress={() => onRsvp(meeting, 'going')}
              disabled={isRsvpBusy}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.rsvpIconCircle,
                  {
                    backgroundColor: myResponse === 'going' ? colors.success + '30' : colors.success + '15',
                    borderColor: myResponse === 'going' ? colors.success : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={myResponse === 'going' ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={18}
                  color={colors.success}
                />
              </View>
              <Text style={[styles.rsvpCount, { color: colors.textPrimary }]}>{counts.going}</Text>
              <Text style={[styles.rsvpLabel, { color: colors.success }]}>Going</Text>
            </TouchableOpacity>

            <View style={[styles.rsvpDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.rsvpItem}
              onPress={() => onRsvp(meeting, 'not_going')}
              disabled={isRsvpBusy}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.rsvpIconCircle,
                  {
                    backgroundColor: myResponse === 'not_going' ? colors.error + '30' : colors.error + '15',
                    borderColor: myResponse === 'not_going' ? colors.error : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={myResponse === 'not_going' ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={18}
                  color={colors.error}
                />
              </View>
              <Text style={[styles.rsvpCount, { color: colors.textPrimary }]}>{counts.notGoing}</Text>
              <Text style={[styles.rsvpLabel, { color: colors.error }]}>Not Going</Text>
            </TouchableOpacity>
          </View>

          {/* Join button */}
          <TouchableOpacity
            onPress={() => onJoin(meeting)}
            disabled={joinDisabled || isJoining}
            activeOpacity={0.88}
            style={styles.joinWrap}
          >
            <LinearGradient
              colors={joinDisabled ? ['#4B5563', '#374151'] : colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinBtn}
            >
              {isJoining ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.joinText}>
                    {meeting.status === 'ended' ? 'Meeting Ended' : meeting.ctaText}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function MeetShareScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrorIds, setImageErrorIds] = useState({});
  const [extrasById, setExtrasById] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadExtrasFor = useCallback(
    async (meetingIds) => {
      if (!meetingIds.length) return;
      const results = await Promise.all(
        meetingIds.map(async (id) => {
          const [countsRes, myRes] = await Promise.all([
            fetchRsvpCounts(id),
            user?.uid ? getUserRsvpResponse(id, user.uid) : Promise.resolve(null),
          ]);
          return [id, { counts: countsRes, myResponse: myRes }];
        })
      );
      if (!mountedRef.current) return;
      setExtrasById((prev) => {
        const next = { ...prev };
        results.forEach(([id, val]) => {
          next[id] = val;
        });
        return next;
      });
    },
    [user?.uid]
  );

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToLiveWorshipMeetings(
      (list) => {
        if (!mountedRef.current) return;
        setMeetings(list);
        setLoading(false);
        setError(null);
        setRefreshing(false);
        loadExtrasFor(list.map((m) => m.id));
      },
      (err) => {
        if (!mountedRef.current) return;
        setError(getFirestoreErrorMessage(err));
        setLoading(false);
        setRefreshing(false);
      }
    );
    return () => typeof unsub === 'function' && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadExtrasFor(meetings.map((m) => m.id)).finally(() => {
      if (mountedRef.current) setRefreshing(false);
    });
  }, [loadExtrasFor, meetings]);

  const handleImageError = useCallback((id) => {
    setImageErrorIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleCopyLink = useCallback(
    async (meeting) => {
      if (!meeting?.meetLink) {
        showToast('No meeting link available yet.', 'error');
        return;
      }
      try {
        setBusyKey(`${meeting.id}-copy`);
        await Clipboard.setStringAsync(meeting.meetLink);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Meeting link copied!', 'success');
      } catch {
        showToast('Could not copy the link. Try again.', 'error');
      } finally {
        setBusyKey(null);
      }
    },
    [showToast]
  );

  const handleJoinMeeting = useCallback(
    async (meeting) => {
      const link = meeting?.meetLink;
      if (!link || !isLikelyUrl(link)) {
        showToast('This meeting link is unavailable right now.', 'error');
        return;
      }
      const url = normalizeUrl(link);
      try {
        setBusyKey(`${meeting.id}-join`);
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          showToast('This meeting link cannot be opened on your device.', 'error');
          return;
        }
        await Linking.openURL(url);
      } catch {
        showToast('Failed to open the meeting link.', 'error');
      } finally {
        if (mountedRef.current) setBusyKey(null);
      }
    },
    [showToast]
  );

  const handleRsvp = useCallback(
    async (meeting, response) => {
      if (!meeting?.id) return;
      if (!user?.uid) {
        showToast('Sign in to let us know you\u2019re going.', 'info');
        return;
      }
      const busyToken = `${meeting.id}-rsvp-${response}`;
      if (busyKey === busyToken) return;

      const previous = extrasById[meeting.id]?.myResponse ?? null;
      const nextResponse = previous === response ? null : response;

      setBusyKey(busyToken);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExtrasById((prev) => ({
        ...prev,
        [meeting.id]: { ...prev[meeting.id], myResponse: nextResponse ?? response },
      }));
      try {
        await setUserRsvpResponse(meeting.id, user.uid, nextResponse ?? response);
        const fresh = await fetchRsvpCounts(meeting.id);
        if (!mountedRef.current) return;
        setExtrasById((prev) => ({
          ...prev,
          [meeting.id]: { counts: fresh, myResponse: nextResponse ?? response },
        }));
      } catch {
        if (!mountedRef.current) return;
        setExtrasById((prev) => ({
          ...prev,
          [meeting.id]: { ...prev[meeting.id], myResponse: previous },
        }));
        showToast('Could not save your response. Try again.', 'error');
      } finally {
        if (mountedRef.current) setBusyKey(null);
      }
    },
    [busyKey, extrasById, showToast, user?.uid]
  );

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
  }, []);

  const headerSubtitle = useMemo(() => {
    if (!meetings.length) return '';
    const liveCount = meetings.filter((m) => m.status === 'live').length;
    if (liveCount) return `${liveCount} live now`;
    return `${meetings.length} upcoming`;
  }, [meetings]);

  // ── Header (shared across all states) ───────────────────────────────────
  const Header = (
    <View style={[styles.headerWrap, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: ACCENT + '22' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={ACCENT} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Live Worship</Text>
            <Ionicons name="heart" size={20} color={ACCENT} style={{ marginLeft: 8 }} />
          </View>
          {headerSubtitle ? (
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{headerSubtitle}</Text>
          ) : null}
        </View>

        <View style={styles.backBtn} />
      </View>
      <View style={[styles.headerUnderline, { backgroundColor: ACCENT }]} />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        {Header}
        <View style={styles.loadingArea}>
          <SkeletonLoader height={220} borderRadius={24} style={{ marginBottom: Spacing.lg }} />
          <SkeletonLoader height={26} width="70%" borderRadius={8} style={{ marginBottom: Spacing.sm }} />
          <SkeletonLoader height={16} width="90%" borderRadius={8} style={{ marginBottom: Spacing.xl }} />
          <SkeletonLoader height={56} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        {Header}
        <LibraryErrorState message={error} onRetry={retry} accent={ACCENT} />
      </View>
    );
  }

  if (!meetings.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        {Header}
        <LibraryEmptyState
          accent={ACCENT}
          icon="videocam-outline"
          title="No Worship Session Yet"
          message="Live worship &amp; prayer meetings will appear here once scheduled by the admin."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {Header}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
      >
        {meetings.map((meeting) => (
          <WorshipMeetingCard
            key={meeting.id}
            meeting={meeting}
            colors={colors}
            isDark={isDark}
            extras={extrasById[meeting.id]}
            busyKey={busyKey}
            onRsvp={handleRsvp}
            onJoin={handleJoinMeeting}
            onCopy={handleCopyLink}
            onImageError={handleImageError}
            imageErrored={!!imageErrorIds[meeting.id]}
          />
        ))}

        <View style={styles.footerRow}>
          <Ionicons name="people" size={16} color={ACCENT} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {'  '}You&apos;re not alone. We&apos;re praying together!{' '}
          </Text>
          <Ionicons name="heart" size={14} color={ACCENT} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerWrap: { paddingHorizontal: 20, paddingBottom: 12, alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: '700', marginTop: 3, letterSpacing: 0.2 },
  headerUnderline: { width: 44, height: 4, borderRadius: 999, marginTop: 8 },

  loadingArea: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  cardBorder: {
    borderRadius: 28,
    padding: 1.5,
    marginBottom: Spacing.lg + 2,
  },
  card: {
    borderRadius: 26.5,
    overflow: 'hidden',
  },

  bannerWrap: { width: '100%', aspectRatio: 4 / 3.55, position: 'relative', overflow: 'hidden' },
  banner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  bannerBadgeRow: {
    position: 'absolute',
    left: Spacing.lg,
    top: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bannerTitleWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  overlayTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  overlaySubtitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  titleDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: 12,
  },
  videoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF' },
  statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

  content: { padding: Spacing.xl },

  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: Spacing.md + 2,
    paddingTop: Spacing.xs,
  },
  quoteMark: { fontSize: 28, fontWeight: '800', lineHeight: 26, marginTop: -2 },
  verseText: { flex: 1, fontSize: Typography.fontSizeMD, lineHeight: 21, fontStyle: 'italic' },

  infoBox: { borderRadius: 18, borderWidth: 1, marginBottom: Spacing.md + 2, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 3,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSizeXS, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: Typography.fontSizeMD, fontWeight: '700', lineHeight: 18 },
  copyBtn: { padding: 6, marginLeft: Spacing.sm },

  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: Spacing.sm + 3,
    marginBottom: Spacing.md + 2,
  },
  rsvpItem: { flex: 1, alignItems: 'center', gap: 3 },
  rsvpIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  rsvpCount: { fontSize: Typography.fontSizeXL, fontWeight: '800' },
  rsvpLabel: { fontSize: Typography.fontSizeXS, fontWeight: '700', letterSpacing: 0.2 },
  rsvpDivider: { width: 1, height: 40 },

  joinWrap: { borderRadius: BorderRadius.round, overflow: 'hidden' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  joinText: { color: '#FFFFFF', fontSize: Typography.fontSizeLG, fontWeight: '800', letterSpacing: 0.2 },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  footerText: { fontSize: Typography.fontSizeSM, fontWeight: '600' },
});
