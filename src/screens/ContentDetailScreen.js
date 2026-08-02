// src/screens/ContentDetailScreen.js
// Shared detail screen for the four "Explore Faith" content catalogues
// (Gospel / Heroes / Kings / Prophets). Renders an inline video player for
// contentTypeId === 'video', and a premium reading view (hero image +
// script passage + description) for story/message/image content — with
// a related-content rail and view counting, all routed through the correct
// collection for `kind` via contentKinds.js. Like/dislike/save/share actions
// have been intentionally removed from this screen.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getContentKindConfig } from '../constants/contentKinds';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_H = Math.round((SCREEN_W * 9) / 16);
const VIEW_THRESHOLD_MS = 8000;
const VIEW_THRESHOLD_RATIO = 0.3;

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export default function ContentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const kind = route.params?.kind;
  const config = getContentKindConfig(kind);
  const accent = config?.accent || colors.primary;

  const [item, setItem] = useState(route.params?.item || null);
  const [loading, setLoading] = useState(!route.params?.item);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState(null);

  const videoRef = useRef(null);
  const hasCountedView = useRef(false);

  const contentId = route.params?.contentId || item?.id;

  useEffect(() => {
    let cancelled = false;
    if (!config) {
      setError('This content type is not supported.');
      setLoading(false);
      return undefined;
    }
    if (route.params?.item) return undefined;
    if (!contentId) {
      setError('This content could not be found.');
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    config
      .fetchContentById(contentId)
      .then((data) => {
        if (cancelled) return;
        if (!data) setError('This content is no longer available.');
        else setItem(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load this content. Check your connection.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config, contentId, route.params?.item]);

  useEffect(() => {
    let cancelled = false;
    if (!config || !item?.category || !item?.id) return undefined;
    config
      .fetchRelated(item.category, item.id, 8)
      .then((items) => !cancelled && setRelated(items))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [config, item?.category, item?.id]);

  const registerViewOnce = useCallback(() => {
    if (!config || !item?.id || !user?.uid || hasCountedView.current) return;
    hasCountedView.current = true;
    config.registerView(item.id, user.uid);
  }, [config, item?.id, user?.uid]);

  // Non-video content: register the view as soon as it's opened.
  useEffect(() => {
    if (item && item.contentTypeId !== 'video') {
      registerViewOnce();
    }
  }, [item, registerViewOnce]);

  const onPlaybackStatusUpdate = useCallback(
    (s) => {
      setStatus(s);
      if (!s.isLoaded) return;
      const ratio = s.durationMillis ? s.positionMillis / s.durationMillis : 0;
      if (s.positionMillis >= VIEW_THRESHOLD_MS || ratio >= VIEW_THRESHOLD_RATIO) {
        registerViewOnce();
      }
    },
    [registerViewOnce]
  );

  const openRelated = (related_item) => {
    hasCountedView.current = false;
    navigation.push('ContentDetail', { kind, item: related_item });
  };

  if (loading) {
    return (
      <View style={[styles.centerFill, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.centerFill, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={accent} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {error || 'Content not found.'}
        </Text>
        <TouchableOpacity
          style={[styles.backPill, { backgroundColor: colors.bgCard }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isVideo = item.contentTypeId === 'video' && !!item.videoUrl;
  const isBuffering = status?.isLoaded && status?.isBuffering;

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isVideo ? 'light-content' : 'dark-content'} backgroundColor={isVideo ? '#000' : 'transparent'} />

      {isVideo ? (
        <View style={styles.playerWrap}>
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={() => setError('Playback failed. Check your connection and try again.')}
          />
          {isBuffering ? (
            <View pointerEvents="none" style={styles.bufferOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : null}
          <View style={[styles.topOverlay, { paddingTop: insets.top > 0 ? insets.top * 0.4 : 10 }]}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()} hitSlop={hit}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.heroWrap}>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.hero}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.hero, { backgroundColor: accent + '20' }]} />
          )}
          <View style={[styles.heroTopOverlay, { paddingTop: insets.top > 0 ? insets.top * 0.4 : 10 }]}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()} hitSlop={hit}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.huge }}>
        <View style={styles.details}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>

          {item.scriptPassage ? (
            <Text style={[styles.scriptPassage, { color: accent }]}>{item.scriptPassage}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatCount(item.views)} views
            </Text>
            {item.category ? (
              <>
                <View style={[styles.metaDot, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.category}</Text>
              </>
            ) : null}
          </View>

          {item.description ? (
            <View style={[styles.descCard, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>
          ) : null}

          {related.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedHeading, { color: colors.textPrimary }]}>
                More {config?.label || ''}
              </Text>
              {related.map((relItem) => (
                <TouchableOpacity
                  key={relItem.id}
                  style={styles.relatedItem}
                  activeOpacity={0.85}
                  onPress={() => openRelated(relItem)}
                >
                  <View style={styles.relatedThumbWrap}>
                    {relItem.thumbnail ? (
                      <Image
                        source={{ uri: relItem.thumbnail }}
                        style={styles.relatedThumb}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.relatedThumb, { backgroundColor: accent + '20' }]} />
                    )}
                  </View>
                  <View style={styles.relatedTextWrap}>
                    <Text style={[styles.relatedTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {relItem.title}
                    </Text>
                    <Text style={[styles.relatedMeta, { color: colors.textMuted }]}>
                      {formatCount(relItem.views)} views
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

  heroWrap: { width: '100%', height: VIDEO_H, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  heroTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
  },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
  },
  overlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  details: { padding: Spacing.xl },
  title: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, lineHeight: 26, marginBottom: Spacing.sm },
  scriptPassage: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.xl },
  metaText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },

  descCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xxl },
  descText: { fontSize: Typography.fontSizeMD, lineHeight: 22 },

  relatedSection: { gap: Spacing.md },
  relatedHeading: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, marginBottom: Spacing.sm },
  relatedItem: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  relatedThumbWrap: { width: 140, height: 80, borderRadius: BorderRadius.md, overflow: 'hidden' },
  relatedThumb: { width: '100%', height: '100%' },
  relatedTextWrap: { flex: 1, justifyContent: 'center' },
  relatedTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, lineHeight: 19, marginBottom: 4 },
  relatedMeta: { fontSize: Typography.fontSizeXS },
});
