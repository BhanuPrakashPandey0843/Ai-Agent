// src/screens/MeetShareScreen.js
// "Live Worship Room" — Firestore: meetSessions (source of truth: admin panel
// at /admin/uploads/upload-meet). Shows the single most relevant meeting
// (live > soonest upcoming > most recently ended) with real-time updates,
// copy-link, join-meeting, and per-user RSVP (going / not going).

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  subscribeToLiveWorshipMeeting,
  getFirestoreErrorMessage,
  getUserRsvpResponse,
  setUserRsvpResponse,
  fetchRsvpCounts,
} from '../services/firebaseService';
import { LIBRARY_ACCENTS } from '../constants/library';
import LibraryEmptyState from '../components/library/LibraryEmptyState';
import LibraryErrorState from '../components/library/LibraryErrorState';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../theme/colors';

const ACCENT = LIBRARY_ACCENTS.meet;

const STATUS_META = {
  live: { label: 'LIVE', color: '#EF4444' },
  upcoming: { label: 'UPCOMING', color: '#3B82F6' },
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

export default function MeetShareScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [counts, setCounts] = useState({ going: 0, notGoing: 0 });
  const [myResponse, setMyResponse] = useState(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadExtras = useCallback(async (meetingId) => {
    if (!meetingId) {
      setCounts({ going: 0, notGoing: 0 });
      setMyResponse(null);
      return;
    }
    const [countsRes, myRes] = await Promise.all([
      fetchRsvpCounts(meetingId),
      user?.uid ? getUserRsvpResponse(meetingId, user.uid) : Promise.resolve(null),
    ]);
    if (!mountedRef.current) return;
    setCounts(countsRes);
    setMyResponse(myRes);
  }, [user?.uid]);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToLiveWorshipMeeting(
      (data) => {
        if (!mountedRef.current) return;
        setMeeting(data);
        setImageError(false);
        setLoading(false);
        setError(null);
        setRefreshing(false);
        loadExtras(data?.id);
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
    loadExtras(meeting?.id).finally(() => {
      if (mountedRef.current) setRefreshing(false);
    });
  }, [loadExtras, meeting?.id]);

  const handleCopyLink = useCallback(async () => {
    if (!meeting?.meetLink) {
      showToast('No meeting link available yet.', 'error');
      return;
    }
    try {
      setCopyBusy(true);
      await Clipboard.setStringAsync(meeting.meetLink);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Meeting link copied!', 'success');
    } catch {
      showToast('Could not copy the link. Try again.', 'error');
    } finally {
      setCopyBusy(false);
    }
  }, [meeting?.meetLink, showToast]);

  const handleJoinMeeting = useCallback(async () => {
    const link = meeting?.meetLink;
    if (!link || !isLikelyUrl(link)) {
      showToast('This meeting link is unavailable right now.', 'error');
      return;
    }
    const url = normalizeUrl(link);
    try {
      setJoining(true);
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showToast('This meeting link cannot be opened on your device.', 'error');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast('Failed to open the meeting link.', 'error');
    } finally {
      if (mountedRef.current) setJoining(false);
    }
  }, [meeting?.meetLink, showToast]);

  const handleRsvp = useCallback(
    async (response) => {
      if (!meeting?.id) return;
      if (!user?.uid) {
        showToast('Sign in to let us know you\u2019re going.', 'info');
        return;
      }
      if (rsvpBusy) return;
      const previous = myResponse;
      const nextResponse = previous === response ? null : response;

      // Optimistic UI update, then reconcile with server counts.
      setRsvpBusy(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMyResponse(nextResponse ?? response);
      try {
        await setUserRsvpResponse(meeting.id, user.uid, nextResponse ?? response);
        const fresh = await fetchRsvpCounts(meeting.id);
        if (!mountedRef.current) return;
        setCounts(fresh);
        setMyResponse(nextResponse ?? response);
      } catch {
        if (!mountedRef.current) return;
        setMyResponse(previous);
        showToast('Could not save your response. Try again.', 'error');
      } finally {
        if (mountedRef.current) setRsvpBusy(false);
      }
    },
    [meeting?.id, myResponse, rsvpBusy, showToast, user?.uid]
  );

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
  }, []);

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

        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Live Worship</Text>
          <Ionicons name="heart" size={20} color={ACCENT} style={{ marginLeft: 8 }} />
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

  if (!meeting) {
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

  const status = STATUS_META[meeting.status] || STATUS_META.upcoming;
  const hasVerse = Boolean(meeting.verseText);
  const hasImage = Boolean(meeting.imageUrl) && !imageError;
  const joinDisabled = meeting.status === 'ended' || !meeting.meetLink;

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
        {/* Gradient-bordered card */}
        <LinearGradient
          colors={isDark ? ['#8B5CF6', ACCENT, '#F59E0B'] : [ACCENT, '#F59E0B', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
            {/* Banner image with title overlaid, matching the live-worship reference design */}
            <View style={styles.bannerWrap}>
              {hasImage ? (
                <Image
                  source={{ uri: meeting.imageUrl }}
                  style={styles.banner}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="memory-disk"
                  onError={() => setImageError(true)}
                />
              ) : (
                <LinearGradient
                  colors={colors.gradientMeet}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.banner}
                >
                  <Ionicons name="add" size={64} color="rgba(255,255,255,0.85)" style={{ transform: [{ rotate: '0deg' }] }} />
                </LinearGradient>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(4,4,8,0.75)', 'rgba(4,4,8,0.98)']}
                locations={[0, 0.35, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.bannerBadgeRow}>
                <View style={styles.videoIconCircle}>
                  <Ionicons name="videocam" size={18} color="#FFFFFF" />
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  {meeting.status === 'live' && <View style={styles.liveDot} />}
                  <Text style={styles.statusBadgeText}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.bannerTitleWrap}>
                <Text style={styles.overlayTitle}>{meeting.title}</Text>
                {!!meeting.subtitle && (
                  <Text style={[styles.overlaySubtitle, { color: ACCENT }]}>{meeting.subtitle}</Text>
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
                    <View style={[styles.infoIcon, { backgroundColor: '#7C3AED22' }]}>
                      <Ionicons name="calendar" size={18} color="#7C3AED" />
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
                    <View style={[styles.infoIcon, { backgroundColor: '#4F46E522' }]}>
                      <Ionicons name="link" size={18} color="#6366F1" />
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
                      onPress={handleCopyLink}
                      disabled={copyBusy}
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
                  onPress={() => handleRsvp('going')}
                  disabled={rsvpBusy}
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
                  onPress={() => handleRsvp('not_going')}
                  disabled={rsvpBusy}
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
                onPress={handleJoinMeeting}
                disabled={joinDisabled || joining}
                activeOpacity={0.88}
                style={styles.joinWrap}
              >
                <LinearGradient
                  colors={joinDisabled ? ['#4B5563', '#374151'] : ['#22D3EE', '#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinBtn}
                >
                  {joining ? (
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

  headerWrap: { paddingHorizontal: 20, paddingBottom: 14, alignItems: 'center' },
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
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerUnderline: { width: 44, height: 4, borderRadius: 999, marginTop: 10 },

  loadingArea: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  cardBorder: {
    borderRadius: 28,
    padding: 1.5,
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: 26.5,
    overflow: 'hidden',
  },

  bannerWrap: { width: '100%', aspectRatio: 4 / 4.6, position: 'relative', overflow: 'hidden' },
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
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  overlaySubtitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  titleDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 14,
  },
  videoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,184,166,0.85)',
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
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  quoteMark: { fontSize: 30, fontWeight: '800', lineHeight: 28, marginTop: -2 },
  verseText: { flex: 1, fontSize: Typography.fontSizeMD, lineHeight: 23, fontStyle: 'italic' },

  infoBox: { borderRadius: 18, borderWidth: 1, marginBottom: Spacing.lg, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSizeXS, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: Typography.fontSizeMD, fontWeight: '700' },
  copyBtn: { padding: 6, marginLeft: Spacing.sm },

  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  rsvpItem: { flex: 1, alignItems: 'center', gap: 4 },
  rsvpIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rsvpCount: { fontSize: Typography.fontSize2XL, fontWeight: '800' },
  rsvpLabel: { fontSize: Typography.fontSizeSM, fontWeight: '700' },
  rsvpDivider: { width: 1, height: 44 },

  joinWrap: { borderRadius: BorderRadius.round, overflow: 'hidden' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  joinText: { color: '#FFFFFF', fontSize: Typography.fontSizeLG, fontWeight: '800', letterSpacing: 0.3 },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
  },
  footerText: { fontSize: Typography.fontSizeSM, fontWeight: '600' },
});
