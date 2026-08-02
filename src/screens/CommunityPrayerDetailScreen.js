// src/screens/CommunityPrayerDetailScreen.js
// Full view of one approved community prayer request: complete text,
// "I'm Praying" toggle + live count, and an encouraging-comments thread.
// Reuses the exact same firebaseService functions the Prayer Room list
// screen uses (togglePrayingForRequest, subscribeToPrayerComments,
// addPrayerComment) — no new Firestore access patterns introduced.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackHeader from '../components/common/BackHeader';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToPrayerComments,
  addPrayerComment,
  togglePrayingForRequest,
  getMyPrayingState,
} from '../services/firebaseService';
import useFirestoreSubscription from '../hooks/useFirestoreSubscription';

const MAX_COMMENT_CHARS = 500;

const timeAgo = (ts) => {
  const ms = ts?.toMillis ? ts.toMillis() : (ts?.seconds ? ts.seconds * 1000 : null);
  if (!ms) return '';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function CommunityPrayerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { showToast } = useToast();
  const { user, userProfile } = useAuth();

  const item = route.params?.item;
  const accent = colors.primary;

  const [prayCount, setPrayCount] = useState(Number(item?.prayCount || 0));
  const [isPraying, setIsPraying] = useState(false);
  const [prayBusy, setPrayBusy] = useState(false);

  useEffect(() => {
    if (!item?.id || !user?.uid) return;
    let cancelled = false;
    getMyPrayingState(item.id, user.uid).then((val) => {
      if (!cancelled) setIsPraying(val);
    });
    return () => {
      cancelled = true;
    };
  }, [item?.id, user?.uid]);

  const handleTogglePray = useCallback(async () => {
    if (!item?.id) return;
    if (!user?.uid) {
      showToast('Please sign in to pray for this request.', 'error');
      return;
    }
    if (prayBusy) return;
    setPrayBusy(true);
    const prevPraying = isPraying;
    const prevCount = prayCount;
    setIsPraying(!prevPraying);
    setPrayCount(prevCount + (prevPraying ? -1 : 1));
    try {
      const next = await togglePrayingForRequest(item.id, user.uid);
      setIsPraying(next);
    } catch (err) {
      setIsPraying(prevPraying);
      setPrayCount(prevCount);
      showToast(err?.message || 'Could not update right now.', 'error');
    } finally {
      setPrayBusy(false);
    }
  }, [item?.id, user?.uid, prayBusy, isPraying, prayCount, showToast]);

  const subscribeComments = useCallback(
    (onData, onError) => subscribeToPrayerComments(item?.id, onData, onError),
    [item?.id]
  );
  const { items: comments, loading: commentsLoading } = useFirestoreSubscription(subscribeComments, null);

  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const scrollRef = useRef(null);

  const handlePostComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (!user?.uid) {
      showToast('Please sign in to leave encouragement.', 'error');
      return;
    }
    if (posting) return;
    setPosting(true);
    try {
      const username = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Believer';
      await addPrayerComment(item.id, { userId: user.uid, username, text: trimmed });
      setCommentText('');
      Keyboard.dismiss();
    } catch (err) {
      showToast(err?.message || 'Could not post your comment.', 'error');
    } finally {
      setPosting(false);
    }
  }, [commentText, user, userProfile, item?.id, posting, showToast]);

  const excerpt = useMemo(() => item?.content?.trim() || '', [item?.content]);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <BackHeader title="Prayer Request" />
        <View style={styles.missingWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.missingText, { color: colors.textMuted }]}>
            This prayer request is no longer available.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <BackHeader title="Prayer Request" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.outer}>
            <LinearGradient
              colors={[colors.bgCard, colors.bgCardSoft]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardContent}>
              <View style={styles.headerRow}>
                {item.category ? (
                  <View style={[styles.badge, { borderColor: accent }]}>
                    <Text style={[styles.badgeText, { color: accent }]}>{item.category.toUpperCase()}</Text>
                  </View>
                ) : <View />}
                {item.anonymous ? (
                  <View style={styles.anonRow}>
                    <Ionicons name="eye-off-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.anonText, { color: colors.textMuted }]}>Anonymous</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>

              {!item.anonymous && item.username ? (
                <Text style={[styles.byline, { color: colors.textMuted }]}>Shared by {item.username}</Text>
              ) : null}

              {excerpt ? (
                <Text style={[styles.body, { color: colors.textSecondary }]}>{excerpt}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.prayBtn,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                  isPraying && { backgroundColor: accent + '20', borderColor: accent },
                ]}
                onPress={handleTogglePray}
                disabled={prayBusy}
                activeOpacity={0.85}
                accessibilityLabel={isPraying ? "You're praying for this request" : "Tap to say you're praying"}
              >
                {prayBusy ? (
                  <ActivityIndicator size="small" color={isPraying ? accent : colors.textSecondary} />
                ) : (
                  <Ionicons name={isPraying ? 'hand-left' : 'hand-left-outline'} size={18} color={isPraying ? accent : colors.textSecondary} />
                )}
                <Text style={[styles.prayBtnText, { color: isPraying ? accent : colors.textSecondary }]}>
                  {isPraying ? "I'm Praying" : "I'm Praying for This"}
                </Text>
                <Text style={[styles.prayCount, { color: colors.textMuted }]}>· {prayCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 26 }}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Encouragement ({comments.length})
            </Text>

            {commentsLoading ? (
              <View style={{ marginTop: 12 }}>
                <SkeletonLoader height={60} borderRadius={16} style={{ marginBottom: 10 }} />
                <SkeletonLoader height={60} borderRadius={16} />
              </View>
            ) : comments.length ? (
              <View style={{ marginTop: 12 }}>
                {comments.map((c) => (
                  <View key={c.id} style={[styles.commentRow, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
                    <View style={styles.commentHeaderRow}>
                      <Text style={[styles.commentUser, { color: colors.textPrimary }]} numberOfLines={1}>
                        {c.username || 'Believer'}
                      </Text>
                      <Text style={[styles.commentTime, { color: colors.textMuted }]}>{timeAgo(c.createdAt)}</Text>
                    </View>
                    <Text style={[styles.commentText, { color: colors.textSecondary }]}>{c.text}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyCommentsText, { color: colors.textMuted }]}>
                  Be the first to leave encouragement.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.composerRow,
            { backgroundColor: colors.bg, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Leave a word of encouragement…"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_COMMENT_CHARS}
            multiline
            style={[
              styles.composerInput,
              { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary },
            ]}
            accessibilityLabel="Write an encouraging comment"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: commentText.trim() ? accent : accent + '50' }]}
            onPress={handlePostComment}
            disabled={!commentText.trim() || posting}
            accessibilityLabel="Post comment"
            activeOpacity={0.85}
          >
            {posting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={17} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  missingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  missingText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  outer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  cardContent: { padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  anonText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 29, marginBottom: 6 },
  byline: { fontSize: 12.5, fontWeight: '600', marginBottom: 14 },
  body: { fontSize: 15.5, lineHeight: 25, fontWeight: '500', marginBottom: 20 },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
  },
  prayBtnText: { fontSize: 14.5, fontWeight: '700' },
  prayCount: { fontSize: 13, fontWeight: '700' },
  sectionHeading: { fontSize: 16, fontWeight: '800' },
  commentRow: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  commentUser: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  commentTime: { fontSize: 11, fontWeight: '500' },
  commentText: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },
  emptyComments: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 10 },
  emptyCommentsText: { fontSize: 13, fontWeight: '600' },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
