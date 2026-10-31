import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  addVideoComment,
  deleteVideoComment,
  fetchMoreVideoComments,
  getMyVideoCommentLike,
  subscribeToVideoComments,
  toggleVideoCommentLike,
  updateVideoComment,
} from '../../services/firebaseService';

const MAX_COMMENT_CHARS = 500;
const relativeTime = (timestamp) => {
  const ms = timestamp?.toMillis?.() ?? (timestamp?.seconds ? timestamp.seconds * 1000 : null);
  if (!ms) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function Avatar({ uri, size = 36, colors }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [uri]);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.bgCardSoft }]}>
      {uri && !imageFailed ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Ionicons name="person" size={size * 0.52} color={colors.textMuted} />
      )}
    </View>
  );
}

const formatCount = (count) => {
  const value = Number(count) || 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

export default function VideoCommentsSection({ videoId, commentCount = 0 }) {
  const { colors } = useTheme();
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedComments, setLikedComments] = useState({});
  const [busyLikes, setBusyLikes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const cursorRef = useRef(null);
  const commentIdsKey = comments.map((comment) => comment.id).join('|');

  useEffect(() => {
    setLikedComments({});
    setBusyLikes({});
  }, [user?.uid, videoId]);

  useEffect(() => {
    if (!videoId) return undefined;
    setLoading(true);
    setLoadError('');
    setComments([]);
    cursorRef.current = null;
    setHasMore(false);
    return subscribeToVideoComments(
      videoId,
      (incoming, cursor, moreAvailable) => {
        const nextLiveIds = new Set(incoming.map((comment) => comment.id));
        setComments((current) => {
          const retainedItems = current.filter((comment) => !nextLiveIds.has(comment.id));
          return [...incoming, ...retainedItems];
        });
        cursorRef.current = cursor;
        setHasMore(moreAvailable);
        setLoading(false);
      },
      (err) => {
        setLoadError(err?.code === 'permission-denied'
          ? 'Comments are unavailable until the latest Firestore rules are deployed.'
          : 'Could not load comments. Check your connection and try again.');
        setLoading(false);
      }
    );
  }, [retryCount, videoId]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid || !comments.length) {
      if (Object.keys(likedComments).length) setLikedComments({});
      return undefined;
    }
    const commentIds = commentIdsKey ? commentIdsKey.split('|') : [];
    const missingIds = commentIds.filter((commentId) => !Object.prototype.hasOwnProperty.call(likedComments, commentId));
    if (!missingIds.length) return undefined;
    Promise.all(missingIds.map(async (commentId) => [
      commentId,
      await getMyVideoCommentLike(videoId, commentId, user.uid),
    ])).then((states) => {
      if (!cancelled) setLikedComments((current) => ({ ...current, ...Object.fromEntries(states) }));
    }).catch((err) => {
      console.warn('[VideoCommentsSection] Could not load comment reactions:', err?.code, err?.message);
    });
    return () => {
      cancelled = true;
    };
  }, [commentIdsKey, likedComments, user?.uid, videoId]);

  const postComment = useCallback(async () => {
    const text = draft.trim();
    if (!text) {
      showToast('Please write a comment before posting.', 'error');
      return;
    }
    if (!user?.uid) {
      showToast('Please sign in to comment.', 'info');
      return;
    }
    if (posting) return;
    setPosting(true);
    try {
      await addVideoComment(videoId, {
        userId: user.uid,
        username: userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Believer',
        photoURL: userProfile?.photoURL || user.photoURL || '',
        text,
      });
      setDraft('');
    } catch (err) {
      showToast(err?.message || 'Could not post your comment. Please try again.', 'error');
    } finally {
      setPosting(false);
    }
  }, [draft, posting, showToast, user, userProfile, videoId]);

  const loadMore = useCallback(async () => {
    if (!cursorRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchMoreVideoComments(videoId, cursorRef.current);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
      setComments((current) => {
        const existing = new Set(current.map((comment) => comment.id));
        return [...current, ...page.items.filter((comment) => !existing.has(comment.id))];
      });
    } catch (err) {
      showToast(err?.message || 'Could not load older comments.', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, showToast, videoId]);

  const toggleCommentLike = useCallback(async (comment) => {
    if (!user?.uid) {
      showToast('Please sign in to like comments.', 'info');
      return;
    }
    if (busyLikes[comment.id]) return;
    const wasLiked = !!likedComments[comment.id];
    setBusyLikes((current) => ({ ...current, [comment.id]: true }));
    setLikedComments((current) => ({ ...current, [comment.id]: !wasLiked }));
    setComments((current) => current.map((item) => (
      item.id === comment.id
        ? { ...item, likeCount: Math.max(0, Number(item.likeCount || 0) + (wasLiked ? -1 : 1)) }
        : item
    )));
    try {
      await toggleVideoCommentLike(videoId, comment.id, user.uid);
    } catch (err) {
      setLikedComments((current) => ({ ...current, [comment.id]: wasLiked }));
      setComments((current) => current.map((item) => (
        item.id === comment.id
          ? { ...item, likeCount: Math.max(0, Number(item.likeCount || 0) + (wasLiked ? 1 : -1)) }
          : item
      )));
      showToast(err?.message || 'Could not update your reaction.', 'error');
    } finally {
      setBusyLikes((current) => ({ ...current, [comment.id]: false }));
    }
  }, [busyLikes, likedComments, showToast, user?.uid, videoId]);

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditDraft(comment.text || '');
  };

  const saveEdit = useCallback(async () => {
    if (!editingId || savingEdit) return;
    setSavingEdit(true);
    try {
      await updateVideoComment(videoId, editingId, user.uid, editDraft);
      setComments((current) => current.map((comment) => (
        comment.id === editingId ? { ...comment, text: editDraft.trim(), editedAt: new Date() } : comment
      )));
      setEditingId(null);
      setEditDraft('');
    } catch (err) {
      showToast(err?.message || 'Could not save your comment.', 'error');
    } finally {
      setSavingEdit(false);
    }
  }, [editDraft, editingId, savingEdit, showToast, user?.uid, videoId]);

  const confirmDelete = (comment) => {
    Alert.alert('Delete comment?', 'This comment will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideoComment(videoId, comment.id, user.uid);
            setComments((current) => current.filter((item) => item.id !== comment.id));
          } catch (err) {
            showToast(err?.message || 'Could not delete your comment.', 'error');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        Comments <Text style={{ color: colors.textMuted }}>({Number(commentCount) || 0})</Text>
      </Text>

      <View style={styles.composer}>
        <Avatar uri={userProfile?.photoURL || user?.photoURL} colors={colors} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={MAX_COMMENT_CHARS}
          textAlignVertical="top"
          accessibilityLabel="Add a comment"
          style={[
            styles.input,
            { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bgCard },
          ]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          disabled={posting || !draft.trim()}
          onPress={postComment}
          style={[styles.postButton, { backgroundColor: draft.trim() ? colors.primary : colors.primary + '70' }]}
        >
          {posting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.postText}>Post</Text>}
        </TouchableOpacity>
      </View>

      {loadError ? (
        <View style={styles.errorState}>
          <Text style={[styles.stateText, { color: colors.error }]}>{loadError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
            style={styles.retryButton}
          >
            <Text style={[styles.moreText, { color: colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : comments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.textMuted} />
          <Text style={[styles.stateText, { color: colors.textMuted }]}>Be the first to share a thought.</Text>
        </View>
      ) : (
        comments.map((comment) => {
          const ownComment = user?.uid && comment.userId === user.uid;
          const liked = !!likedComments[comment.id];
          return (
            <View key={comment.id} style={styles.comment}>
              <Avatar uri={comment.photoURL} size={34} colors={colors} />
              <View style={styles.commentContent}>
                <View style={styles.authorRow}>
                  <Text style={[styles.author, { color: colors.textPrimary }]} numberOfLines={1}>
                    {comment.username || 'Believer'}
                  </Text>
                  <Text style={[styles.time, { color: colors.textMuted }]}>
                    {relativeTime(comment.createdAt)}{comment.editedAt ? ' · edited' : ''}
                  </Text>
                </View>
                {editingId === comment.id ? (
                  <>
                    <TextInput
                      value={editDraft}
                      onChangeText={setEditDraft}
                      multiline
                      maxLength={MAX_COMMENT_CHARS}
                      accessibilityLabel="Edit your comment"
                      style={[styles.editInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={() => setEditingId(null)}><Text style={{ color: colors.textMuted }}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity onPress={saveEdit} disabled={savingEdit || !editDraft.trim()}>
                        {savingEdit ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: '700' }}>Save</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
                )}
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'}
                    onPress={() => toggleCommentLike(comment)}
                    style={styles.likeButton}
                    disabled={!!busyLikes[comment.id]}
                  >
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={17} color={liked ? colors.primary : colors.textMuted} />
                    <Text style={[styles.likeCount, { color: liked ? colors.primary : colors.textMuted }]}>
                      {formatCount(comment.likeCount)}
                    </Text>
                  </TouchableOpacity>
                  {ownComment && editingId !== comment.id ? (
                    <>
                      <TouchableOpacity onPress={() => startEdit(comment)} accessibilityLabel="Edit comment">
                        <Text style={[styles.ownerAction, { color: colors.textMuted }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete(comment)} accessibilityLabel="Delete comment">
                        <Text style={[styles.ownerAction, { color: colors.textMuted }]}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })
      )}

      {hasMore ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={loadMore}
          disabled={loadingMore}
          style={styles.moreButton}
        >
          {loadingMore
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.moreText, { color: colors.primary }]}>Load older comments</Text>}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  composer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, lineHeight: 20 },
  postButton: { minWidth: 50, minHeight: 42, paddingHorizontal: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  postText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  loader: { marginVertical: 22 },
  stateText: { fontSize: 13, lineHeight: 19, textAlign: 'center', paddingVertical: 12 },
  errorState: { alignItems: 'center', paddingBottom: 12 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  commentContent: { flex: 1, minWidth: 0 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  author: { flexShrink: 1, fontSize: 13, fontWeight: '700' },
  time: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 34, marginTop: 3 },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 44, minHeight: 34 },
  likeCount: { fontSize: 12, fontWeight: '600' },
  ownerAction: { fontSize: 12, fontWeight: '600', paddingVertical: 8 },
  editInput: { minHeight: 48, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18, marginTop: 10 },
  moreButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  retryButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16 },
  moreText: { fontWeight: '700', fontSize: 13 },
});
