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
  Share,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import useVideoInteraction from '../hooks/useVideoInteraction';
import {
  fetchWitnessVideoById,
  fetchRelatedWitnessVideos,
  registerVideoView,
} from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_H = Math.round((SCREEN_W * 9) / 16);
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
  const { colors } = useTheme();
  const { user } = useAuth();

  const [video, setVideo] = useState(route.params?.video || null);
  const [loading, setLoading] = useState(!route.params?.video);
  const [error, setError] = useState(null);

  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState(null);
  const [rateIndex, setRateIndex] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const videoRef = useRef(null);
  const hasCountedView = useRef(false);
  const hasRestoredPosition = useRef(false);

  const { liked, disliked, saved, likeCount, dislikeCount, like, dislike, toggleSave } =
    useVideoInteraction(video);

  const videoId = route.params?.videoId || video?.id;

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

  const handleShare = async () => {
    try {
      await Share.share({
        message: video?.videoUrl
          ? `${video.title} — watch on Faith Frames\n${video.videoUrl}`
          : `${video?.title} — watch on Faith Frames`,
      });
    } catch {
      // cancelled — no-op
    }
  };

  const openRelated = (item) => {
    hasCountedView.current = false;
    navigation.push('VideoPlayer', { video: item });
  };

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

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Player */}
      <View style={styles.playerWrap}>
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

        {/* Custom overlay: back + speed + mute (native controls handle play/pause/seek/fullscreen) */}
        <View style={[styles.topOverlay, { paddingTop: insets.top > 0 ? insets.top * 0.4 : 10 }]}>
          <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()} hitSlop={hit}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topRightRow}>
            <TouchableOpacity style={styles.overlayBtn} onPress={toggleMute} hitSlop={hit}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => setShowSpeedMenu((v) => !v)} hitSlop={hit}>
              <Text style={styles.speedText}>{PLAYBACK_RATES[rateIndex]}x</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayBtn} onPress={enterFullscreen} hitSlop={hit}>
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

        {/* Forward / backward 10s — center overlay, tap-through friendly */}
        <View pointerEvents="box-none" style={styles.centerControls}>
          <TouchableOpacity style={styles.seekBtn} onPress={() => seekBy(-10000)} hitSlop={hit}>
            <Ionicons name="play-back" size={26} color="#FFFFFF" />
            <Text style={styles.seekLabel}>10</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.seekBtn} onPress={togglePlay} hitSlop={hit}>
            <Ionicons name={status?.isPlaying ? 'pause' : 'play'} size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.seekBtn} onPress={() => seekBy(10000)} hitSlop={hit}>
            <Ionicons name="play-forward" size={26} color="#FFFFFF" />
            <Text style={styles.seekLabel}>10</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Details */}
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: Spacing.huge }}>
        <View style={styles.details}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{video.title}</Text>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatCount(video.views)} views
            </Text>
            <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {video.category || 'General'}
            </Text>
          </View>

          <View style={[styles.actionsRow, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={like} hitSlop={hit}>
              <Ionicons
                name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={20}
                color={liked ? ACCENT : colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: liked ? ACCENT : colors.textSecondary }]}>
                {formatCount(likeCount)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={dislike} hitSlop={hit}>
              <Ionicons
                name={disliked ? 'thumbs-down' : 'thumbs-down-outline'}
                size={20}
                color={disliked ? colors.error : colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: disliked ? colors.error : colors.textSecondary }]}>
                {formatCount(dislikeCount)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={toggleSave} hitSlop={hit}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? ACCENT : colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: saved ? ACCENT : colors.textSecondary }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} hitSlop={hit}>
              <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
            </TouchableOpacity>
          </View>

          {video.description ? (
            <View style={[styles.descCard, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>{video.description}</Text>
            </View>
          ) : null}

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
    </View>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl },
  errorText: { fontSize: Typography.fontSizeMD, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  backPill: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.round },

  playerWrap: { width: '100%', height: VIDEO_H, backgroundColor: '#000' },
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
    width: 34,
    height: 34,
    borderRadius: 17,
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

  details: { padding: Spacing.xl },
  title: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, lineHeight: 26, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  metaText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xl,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightSemiBold },

  descCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xxl },
  descText: { fontSize: Typography.fontSizeMD, lineHeight: 22 },

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
