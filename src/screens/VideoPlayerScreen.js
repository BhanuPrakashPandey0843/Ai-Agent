// src/screens/VideoPlayerScreen.js
// Dedicated premium video playback screen for Witness Videos. Videos never
// play inline in the list — this is the only place playback happens.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import useVideoInteraction from '../hooks/useVideoInteraction';
import VideoCommentsSection from '../components/library/VideoCommentsSection';
import {
  fetchWitnessVideoById,
  fetchRelatedWitnessVideos,
  registerVideoView,
} from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2];
const VIEW_THRESHOLD_MS = 20000; // count a view after 20s of real playback
const VIEW_THRESHOLD_RATIO = 0.3; // or 30% of the video, whichever comes first
const POSITION_KEY_PREFIX = 'faithframes_witness_video_position_';
const ACCENT = '#F59E0B';

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export default function VideoPlayerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [video, setVideo] = useState(route.params?.video || null);
  const [loading, setLoading] = useState(!route.params?.video);
  const [error, setError] = useState(null);

  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState(null);
  const [rateIndex, setRateIndex] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const {
    liked,
    disliked,
    likeCount,
    dislikeCount,
    viewCount,
    commentCount,
    like,
    dislike,
    busy: reactionBusy,
    needsAuth,
  } = useVideoInteraction(video);

  const videoRef = useRef(null);
  const hasCountedView = useRef(false);
  const hasRestoredPosition = useRef(false);

  const videoId = route.params?.videoId || video?.id;
  const playerWidth = Math.min(windowWidth, 1024);
  const playerHeight = Math.round((playerWidth * 9) / 16);

  // ── Load video doc (if only an id was passed) ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (route.params?.video) return undefined;
    if (!videoId) {
      setError('This video could not be found.');
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchWitnessVideoById(videoId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('This video is no longer available.');
        } else {
          setVideo(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load this video. Check your connection.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId, route.params?.video]);

  // ── Related videos ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!video?.category || !video?.id) return undefined;
    fetchRelatedWitnessVideos(video.category, video.id, 8)
      .then((items) => !cancelled && setRelated(items))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [video?.category, video?.id]);

  // ── Resume playback position ───────────────────────────────────────
  useEffect(() => {
    if (!video?.id) return;
    AsyncStorage.getItem(POSITION_KEY_PREFIX + video.id)
      .then((raw) => {
        const ms = raw ? Number(raw) : 0;
        if (ms > 3000) hasRestoredPosition.current = ms;
      })
      .catch(() => {});
  }, [video?.id]);

  // Persist playback position on unmount / when leaving the screen
  useEffect(() => {
    return () => {
      const pos = status?.positionMillis;
      const dur = status?.durationMillis;
      if (video?.id && pos != null && dur && pos < dur * 0.95) {
        AsyncStorage.setItem(POSITION_KEY_PREFIX + video.id, String(pos)).catch(() => {});
      } else if (video?.id) {
        AsyncStorage.removeItem(POSITION_KEY_PREFIX + video.id).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  const onPlaybackStatusUpdate = useCallback(
    (s) => {
      setStatus(s);
      if (!s.isLoaded || !video?.id || !user?.uid || hasCountedView.current) return;
      const ratio = s.durationMillis ? s.positionMillis / s.durationMillis : 0;
      if (s.positionMillis >= VIEW_THRESHOLD_MS || ratio >= VIEW_THRESHOLD_RATIO) {
        hasCountedView.current = true;
        registerVideoView(video.id, user.uid);
      }
    },
    [video?.id, user?.uid]
  );

  const onLoad = useCallback(async () => {
    if (hasRestoredPosition.current && videoRef.current) {
      const resumeAt = hasRestoredPosition.current;
      hasRestoredPosition.current = false;
      try {
        await videoRef.current.setPositionAsync(resumeAt);
      } catch {
        // ignore — playback continues from the start
      }
    }
  }, []);

  const togglePlay = () => {
    if (!status) return;
    if (status.isPlaying) videoRef.current?.pauseAsync();
    else videoRef.current?.playAsync();
  };

  const seekBy = (deltaMs) => {
    if (!status?.durationMillis) return;
    const next = Math.max(0, Math.min(status.durationMillis, (status.positionMillis || 0) + deltaMs));
    videoRef.current?.setPositionAsync(next);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    videoRef.current?.setIsMutedAsync(next);
  };

  const cycleRate = (idx) => {
    setRateIndex(idx);
    setShowSpeedMenu(false);
    videoRef.current?.setRateAsync(PLAYBACK_RATES[idx], true);
  };

  const enterFullscreen = () => {
    videoRef.current?.presentFullscreenPlayer?.();
  };

  const openRelated = (item) => {
    hasCountedView.current = false;
    navigation.push('VideoPlayer', { video: item });
  };

  const handleReaction = useCallback((action) => {
    if (needsAuth) {
      showToast('Please sign in to react to videos.', 'info');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    action();
  }, [needsAuth, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const link = video?.shareUrl || video?.videoUrl || '';
      await Share.share({
        title: video?.title || 'Scripture video',
        message: `${video?.title || 'Scripture video'}${link ? `\n${link}` : ''}`,
      });
    } catch (err) {
      showToast(err?.message || 'Could not open the share sheet.', 'error');
    }
  }, [showToast, video?.shareUrl, video?.title, video?.videoUrl]);

  // ── Loading / error states ─────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centerFill, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error || !video) {
    return (
      <View style={[styles.centerFill, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={ACCENT} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error || 'Video not found.'}</Text>
        <TouchableOpacity
          style={[styles.backPill, { backgroundColor: colors.bgCard }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBuffering = status?.isLoaded && status?.isBuffering;
  const creatorName = video.channelName || video.creator || video.author || '';

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={[styles.playerWrap, { width: playerWidth, height: playerHeight }]}>
            <Video
              ref={videoRef}
              source={{ uri: video.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              isMuted={muted}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              onLoad={onLoad}
              onError={() => setError('Playback failed. Check your connection and try again.')}
            />

            {isBuffering ? (
              <View pointerEvents="none" style={styles.bufferOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : null}

            <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.overlayBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.topRightRow}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={muted ? 'Unmute video' : 'Mute video'} style={styles.overlayBtn} onPress={toggleMute}>
                  <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Playback speed" style={styles.overlayBtn} onPress={() => setShowSpeedMenu((v) => !v)}>
                  <Text style={styles.speedText}>{PLAYBACK_RATES[rateIndex]}x</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Full screen" style={styles.overlayBtn} onPress={enterFullscreen}>
                  <Ionicons name="expand" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {showSpeedMenu ? (
              <View style={styles.speedMenu}>
                {PLAYBACK_RATES.map((rate, idx) => (
                  <TouchableOpacity key={rate} style={styles.speedOption} onPress={() => cycleRate(idx)}>
                    <Text style={[styles.speedOptionText, idx === rateIndex && { color: ACCENT, fontWeight: '800' }]}>
                      {rate}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View pointerEvents="box-none" style={styles.centerControls}>
              <TouchableOpacity accessibilityLabel="Rewind 10 seconds" style={styles.seekBtn} onPress={() => seekBy(-10000)}>
                <Ionicons name="play-back" size={26} color="#FFFFFF" />
                <Text style={styles.seekLabel}>10</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel={status?.isPlaying ? 'Pause video' : 'Play video'} style={styles.seekBtn} onPress={togglePlay}>
                <Ionicons name={status?.isPlaying ? 'pause' : 'play'} size={30} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Forward 10 seconds" style={styles.seekBtn} onPress={() => seekBy(10000)}>
                <Ionicons name="play-forward" size={26} color="#FFFFFF" />
                <Text style={styles.seekLabel}>10</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.details}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{video.title}</Text>

            {creatorName ? (
              <View style={styles.creatorRow}>
                <View style={[styles.creatorIcon, { backgroundColor: colors.bgCardSoft }]}>
                  <Ionicons name="person" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.creatorText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {creatorName}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatCount(viewCount)} views</Text>
              <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
              <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                {video.category || 'General'}
              </Text>
            </View>

            <View style={[styles.actionRow, { borderColor: colors.border }]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Like video, ${formatCount(likeCount)} likes`}
                accessibilityState={{ selected: liked, disabled: reactionBusy }}
                disabled={reactionBusy}
                onPress={() => handleReaction(like)}
                activeOpacity={0.75}
                style={[styles.actionButton, liked && { backgroundColor: colors.primary + '18' }]}
              >
                <Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={19} color={liked ? colors.primary : colors.textSecondary} />
                <Text style={[styles.actionText, { color: liked ? colors.primary : colors.textSecondary }]}>{formatCount(likeCount)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Dislike video, ${formatCount(dislikeCount)} dislikes`}
                accessibilityState={{ selected: disliked, disabled: reactionBusy }}
                disabled={reactionBusy}
                onPress={() => handleReaction(dislike)}
                activeOpacity={0.75}
                style={[styles.actionButton, disliked && { backgroundColor: colors.primary + '18' }]}
              >
                <Ionicons name={disliked ? 'thumbs-down' : 'thumbs-down-outline'} size={19} color={disliked ? colors.primary : colors.textSecondary} />
                <Text style={[styles.actionText, { color: disliked ? colors.primary : colors.textSecondary }]}>{formatCount(dislikeCount)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Share video"
                onPress={handleShare}
                activeOpacity={0.75}
                style={styles.actionButton}
              >
                <Ionicons name="share-social-outline" size={19} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
              </TouchableOpacity>
            </View>

            <VideoCommentsSection videoId={video.id} commentCount={commentCount} />

            {related.length > 0 ? (
              <View style={styles.relatedSection}>
                <Text style={[styles.relatedHeading, { color: colors.textPrimary }]}>Related Videos</Text>
                {related.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.relatedItem}
                    activeOpacity={0.85}
                    onPress={() => openRelated(item)}
                  >
                    <View style={styles.relatedThumbWrap}>
                      {item.thumbnail ? (
                        <Image
                          source={{ uri: item.thumbnail }}
                          style={styles.relatedThumb}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={200}
                        />
                      ) : (
                        <View style={[styles.relatedThumb, { backgroundColor: ACCENT + '20' }]} />
                      )}
                      <View style={styles.relatedDurationBadge}>
                        <Text style={styles.relatedDurationText}>{formatDuration(item.duration)}</Text>
                      </View>
                    </View>
                    <View style={styles.relatedTextWrap}>
                      <Text style={[styles.relatedTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.relatedMeta, { color: colors.textMuted }]}>
                        {formatCount(item.views)} views
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl },
  errorText: { fontSize: Typography.fontSizeMD, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  backPill: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.round },

  playerWrap: { alignSelf: 'center', backgroundColor: '#000', overflow: 'hidden' },
  video: { width: '100%', height: '100%' },
  bufferOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  overlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: { color: '#FFFFFF', fontWeight: Typography.fontWeightBold, fontSize: 12 },
  speedMenu: {
    position: 'absolute',
    top: 48,
    right: Spacing.md,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: BorderRadius.md,
    paddingVertical: 4,
  },
  speedOption: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  speedOptionText: { color: '#FFFFFF', fontSize: 13, fontWeight: Typography.fontWeightMedium },

  centerControls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.huge,
  },
  seekBtn: { alignItems: 'center', justifyContent: 'center' },
  seekLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: Typography.fontWeightBold, marginTop: -4 },

  details: { width: '100%', maxWidth: 1024, alignSelf: 'center', padding: Spacing.lg },
  title: { flexShrink: 1, fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, lineHeight: 26, marginBottom: Spacing.sm },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  creatorIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  creatorText: { flexShrink: 1, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  metaText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: Spacing.md, marginBottom: Spacing.lg },
  actionButton: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: BorderRadius.md, paddingHorizontal: 6 },
  actionText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },

  relatedSection: { gap: Spacing.md },
  relatedHeading: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, marginBottom: Spacing.sm },
  relatedItem: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  relatedThumbWrap: { width: 140, height: 80, borderRadius: BorderRadius.md, overflow: 'hidden', position: 'relative' },
  relatedThumb: { width: '100%', height: '100%' },
  relatedDurationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  relatedDurationText: { color: '#FFFFFF', fontSize: 10, fontWeight: Typography.fontWeightBold },
  relatedTextWrap: { flex: 1, justifyContent: 'center' },
  relatedTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, lineHeight: 19, marginBottom: 4 },
  relatedMeta: { fontSize: Typography.fontSizeXS },
});
