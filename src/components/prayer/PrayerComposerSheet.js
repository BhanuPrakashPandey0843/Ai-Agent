// src/components/prayer/PrayerComposerSheet.js
// Bottom sheet for creating and editing a prayer.
//
//  - Personal prayer  : private to the owner, tied to a day, never moderated.
//  - Community prayer : shared with the community after admin approval
//                       (same flow as the existing "Write a Prayer" screen).
//
// Uses the existing firebaseService functions (createUserPrayer /
// updateMyUserPrayer) and the same Firebase-auth session checks as
// WritePrayerScreen. Built on RN's Modal + Animated only — no new dependency.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';
import { createUserPrayer, updateMyUserPrayer, USER_PRAYER_LIMITS } from '../../services/firebaseService';
import {
  MAX_PRAYER_WORDS,
  countWords,
  withTimeout,
  describePrayerError,
  getTodayKey,
  shiftDateKey,
  formatDateKey,
} from '../../utils/prayerRoom';

const SUBMIT_TIMEOUT_MS = 20000;
const DAYS_BACK = 30;
const DAYS_FORWARD = 30;

const CATEGORY_TILES = [
  { key: 'personal', label: 'Personal', caption: 'Only you can see it', icon: 'lock-closed-outline' },
  { key: 'community', label: 'Community', caption: 'Shared after review', icon: 'people-outline' },
];

export default function PrayerComposerSheet({
  visible,
  mode = 'create', // 'create' | 'edit'
  initial = null, // edit: { sourceId, category, title, description, content, anonymous, displayDate }
  defaultCategory = 'community',
  defaultDateKey,
  onClose,
  onSaved,
}) {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { user, userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const accent = colors.primary;
  const editing = mode === 'edit' && !!initial;

  const [mounted, setMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const [category, setCategory] = useState('community');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [dayKey, setDayKey] = useState(getTodayKey());
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submittingRef = useRef(false);
  const doneTimer = useRef(null);
  const contentRef = useRef(null);

  // ─── Open / close animation ───────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  // ─── Reset the form each time the sheet opens ─────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setCategory(editing ? initial.category || 'community' : defaultCategory);
    setTitle(editing ? initial.title || '' : '');
    setDescription(editing ? initial.description || '' : '');
    setContent(editing ? initial.content || '' : '');
    setAnonymous(editing ? initial.anonymous === true : false);
    setDayKey(editing && initial.displayDate ? initial.displayDate : defaultDateKey || getTodayKey());
    setShowErrors(false);
    setSubmitting(false);
    setSuccess(false);
    successAnim.setValue(0);
    submittingRef.current = false;
    // Intentionally only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(
    () => () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    []
  );

  const isPersonal = category === 'personal';

  // ─── Date stepper bounds (same window as the date strip) ─────────────────
  const todayKey = getTodayKey();
  const minKey = useMemo(() => {
    const base = shiftDateKey(todayKey, -DAYS_BACK);
    return editing && initial?.displayDate && initial.displayDate < base ? initial.displayDate : base;
  }, [todayKey, editing, initial]);
  const maxKey = useMemo(() => shiftDateKey(todayKey, DAYS_FORWARD), [todayKey]);
  const stepDay = useCallback(
    (delta) => {
      setDayKey((cur) => {
        const next = shiftDateKey(cur, delta);
        if (next < minKey || next > maxKey) return cur;
        return next;
      });
    },
    [minKey, maxKey]
  );

  // ─── Validation ───────────────────────────────────────────────────────────
  const words = useMemo(() => countWords(content), [content]);
  const errors = useMemo(() => {
    const e = {};
    if (!title.trim()) e.title = 'Please enter a prayer title';
    else if (title.length > USER_PRAYER_LIMITS.title) e.title = `Title must be ${USER_PRAYER_LIMITS.title} characters or fewer`;
    if (!content.trim()) e.content = 'Please write your prayer';
    else if (words > MAX_PRAYER_WORDS) e.content = `Prayer exceeds the ${MAX_PRAYER_WORDS} word limit by ${words - MAX_PRAYER_WORDS}`;
    else if (content.trim().length > USER_PRAYER_LIMITS.content) {
      e.content = `Prayer is ${content.trim().length - USER_PRAYER_LIMITS.content} characters over the limit`;
    }
    if (description.length > USER_PRAYER_LIMITS.description) {
      e.description = `Description must be ${USER_PRAYER_LIMITS.description} characters or fewer`;
    }
    return e;
  }, [title, content, description, words]);
  const hasErrors = Object.keys(errors).length > 0;

  const dirty = useMemo(() => {
    if (editing) {
      return (
        title !== (initial.title || '') ||
        content !== (initial.content || '') ||
        description !== (initial.description || '') ||
        anonymous !== (initial.anonymous === true) ||
        (isPersonal && dayKey !== (initial.displayDate || dayKey))
      );
    }
    return !!(title.trim() || content.trim() || description.trim());
  }, [editing, initial, title, content, description, anonymous, isPersonal, dayKey]);

  // ─── Close (with discard confirmation when there is unsaved text) ────────
  const requestClose = useCallback(() => {
    if (submittingRef.current || success) return;
    Keyboard.dismiss();
    if (dirty) {
      // Alert.alert with buttons does nothing on react-native-web, which would
      // leave the sheet impossible to dismiss, so use the browser confirm there.
      if (Platform.OS === 'web') {
        const discard = typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Discard changes? What you wrote will be lost.')
          : true;
        if (discard) onClose?.();
        return;
      }
      Alert.alert('Discard changes?', 'What you wrote will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => onClose?.() },
      ]);
      return;
    }
    onClose?.();
  }, [dirty, success, onClose]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return; // blocks double-taps / duplicate submissions
    setShowErrors(true);
    if (hasErrors) return;
    if (editing && !dirty) {
      onClose?.();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    Keyboard.dismiss();
    try {
      // Firebase Auth is the source of truth (same pattern as WritePrayerScreen).
      const sessionUser = auth.currentUser;
      if (!sessionUser) {
        const noSession = new Error('No active session');
        noSession.code = 'app/no-session';
        throw noSession;
      }
      await sessionUser.getIdToken();

      const profileName = sessionUser.uid === user?.uid ? userProfile?.name : null;
      const realName = profileName || sessionUser.displayName || sessionUser.email?.split('@')[0] || 'Believer';
      const username = !isPersonal && anonymous ? 'Anonymous' : realName;

      if (editing) {
        await withTimeout(
          updateMyUserPrayer(initial.sourceId, sessionUser.uid, {
            title: title.trim(),
            description: description.trim(),
            content: content.trim(),
            anonymous,
            username,
            displayDate: isPersonal ? dayKey : undefined,
          }),
          SUBMIT_TIMEOUT_MS
        );
      } else {
        await withTimeout(
          createUserPrayer({
            userId: sessionUser.uid,
            title: title.trim(),
            description: description.trim(),
            content: content.trim(),
            anonymous: isPersonal ? false : anonymous,
            username,
            category,
            displayDate: isPersonal ? dayKey : undefined,
          }),
          SUBMIT_TIMEOUT_MS
        );
      }

      // Animated confirmation, then hand control back to the screen.
      setSuccess(true);
      Animated.spring(successAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
      doneTimer.current = setTimeout(() => {
        setSuccess(false);
        submittingRef.current = false;
        setSubmitting(false);
        onSaved?.({ mode: editing ? 'edit' : 'create', category, displayDate: isPersonal ? dayKey : null });
      }, 950);
    } catch (err) {
      console.error('[PrayerComposer] save failed:', err?.code, err?.message);
      showToast(describePrayerError(err, editing), 'error', 5000);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [
    hasErrors,
    editing,
    dirty,
    initial,
    user,
    userProfile,
    title,
    description,
    content,
    anonymous,
    category,
    isPersonal,
    dayKey,
    successAnim,
    onClose,
    onSaved,
    showToast,
  ]);

  if (!mounted) return null;

  const sheetBg = isDark ? colors.bgSecondary : '#FFFBF6';
  const inputBg = isDark ? colors.bgCard : '#FFFFFF';
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [windowH, 0] });
  const submitLabel = editing ? 'Save changes' : isPersonal ? 'Add prayer' : 'Submit prayer';
  const errColor = colors.error;

  const fieldBorder = (key) => (showErrors && errors[key] ? errColor : colors.border);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={requestClose}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetBg,
              borderColor: colors.border,
              maxHeight: Math.round(windowH * 0.92),
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heading, { color: colors.textPrimary }]}>
                {editing ? 'Edit prayer' : 'New prayer'}
              </Text>
              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                {isPersonal ? 'A private prayer for your day.' : 'Share a request with the community.'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={requestClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={[styles.closeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.form}
          >
            {/* Type */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>Prayer type</Text>
            <View style={styles.tiles}>
              {CATEGORY_TILES.map((tile) => {
                const active = tile.key === category;
                return (
                  <TouchableOpacity
                    key={tile.key}
                    disabled={editing}
                    onPress={() => setCategory(tile.key)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: editing }}
                    style={[
                      styles.tile,
                      {
                        backgroundColor: active ? colors.accentSoft : inputBg,
                        borderColor: active ? accent : colors.border,
                        opacity: editing && !active ? 0.45 : 1,
                      },
                    ]}
                  >
                    <Ionicons name={tile.icon} size={18} color={active ? accent : colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tileLabel, { color: active ? accent : colors.textPrimary }]}>{tile.label}</Text>
                      <Text style={[styles.tileCaption, { color: colors.textMuted }]} numberOfLines={1}>
                        {tile.caption}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Title <Text style={{ color: errColor }}>*</Text>
              </Text>
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {title.length}/{USER_PRAYER_LIMITS.title}
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter prayer title"
              placeholderTextColor={colors.textMuted}
              maxLength={USER_PRAYER_LIMITS.title}
              returnKeyType="next"
              onSubmitEditing={() => contentRef.current?.focus()}
              accessibilityLabel="Prayer title"
              style={[styles.input, { backgroundColor: inputBg, borderColor: fieldBorder('title'), color: colors.textPrimary }]}
            />
            {showErrors && errors.title ? <Text style={[styles.error, { color: errColor }]}>{errors.title}</Text> : null}

            {/* Content */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Prayer <Text style={{ color: errColor }}>*</Text>
              </Text>
              <Text
                style={[
                  styles.counter,
                  { color: words > MAX_PRAYER_WORDS ? errColor : colors.textMuted },
                ]}
              >
                {words}/{MAX_PRAYER_WORDS} words
              </Text>
            </View>
            <TextInput
              ref={contentRef}
              value={content}
              onChangeText={setContent}
              placeholder="Write your prayer here..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Prayer content"
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: inputBg, borderColor: fieldBorder('content'), color: colors.textPrimary },
              ]}
            />
            {showErrors && errors.content ? <Text style={[styles.error, { color: errColor }]}>{errors.content}</Text> : null}

            {/* Short description */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Short description (optional)</Text>
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {description.length}/{USER_PRAYER_LIMITS.description}
              </Text>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="A one-line summary shown on the card"
              placeholderTextColor={colors.textMuted}
              maxLength={USER_PRAYER_LIMITS.description}
              multiline
              accessibilityLabel="Prayer description"
              style={[styles.input, styles.textareaSmall, { backgroundColor: inputBg, borderColor: fieldBorder('description'), color: colors.textPrimary }]}
            />
            {showErrors && errors.description ? (
              <Text style={[styles.error, { color: errColor }]}>{errors.description}</Text>
            ) : null}

            {/* Date (personal) */}
            {isPersonal ? (
              <>
                <Text style={[styles.label, { color: colors.textPrimary, marginTop: 16 }]}>Prayer date</Text>
                <View style={[styles.dateRow, { backgroundColor: inputBg, borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => stepDay(-1)}
                    disabled={dayKey <= minKey}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Previous day"
                    style={[styles.dateBtn, dayKey <= minKey && { opacity: 0.35 }]}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.dateCenter}>
                    <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                      {dayKey === todayKey ? 'Today' : formatDateKey(dayKey, true)}
                    </Text>
                    {dayKey !== todayKey ? (
                      <TouchableOpacity onPress={() => setDayKey(todayKey)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={[styles.dateReset, { color: accent }]}>Jump to today</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => stepDay(1)}
                    disabled={dayKey >= maxKey}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Next day"
                    style={[styles.dateBtn, dayKey >= maxKey && { opacity: 0.35 }]}
                  >
                    <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={[styles.toggleRow, { backgroundColor: inputBg, borderColor: colors.border }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Post anonymously</Text>
                  <Text style={[styles.toggleCaption, { color: colors.textMuted }]}>
                    Hide your name from the community once approved.
                  </Text>
                </View>
                <Switch
                  value={anonymous}
                  onValueChange={setAnonymous}
                  trackColor={{ false: isDark ? '#2A2A2A' : '#E5E7EB', true: accent + '80' }}
                  thumbColor={anonymous ? accent : isDark ? '#8A8A8A' : '#F9FAFB'}
                  accessibilityLabel="Post anonymously"
                />
              </View>
            )}

            {!isPersonal ? (
              <View style={styles.note}>
                <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                <Text style={[styles.noteText, { color: colors.textMuted }]}>
                  {editing
                    ? 'Saving changes sends this prayer to our team for review again before it is shown.'
                    : 'Community prayers are reviewed by our team before they appear.'}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={requestClose}
              disabled={submitting}
              activeOpacity={0.8}
              accessibilityRole="button"
              style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: inputBg }]}
            >
              <Text style={[styles.cancelText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              style={[styles.submitBtn, { backgroundColor: accent, opacity: submitting ? 0.7 : 1 }]}
            >
              {submitting && !success ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={editing ? 'checkmark' : 'paper-plane'} size={16} color="#FFFFFF" />
              )}
              <Text style={styles.submitText}>{submitting && !success ? 'Saving…' : submitLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* Success confirmation */}
          {success ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.successOverlay, { backgroundColor: sheetBg, opacity: successAnim }]}
            >
              <Animated.View
                style={[
                  styles.successCircle,
                  { backgroundColor: accent, transform: [{ scale: successAnim }] },
                ]}
              >
                <Ionicons name="checkmark" size={34} color="#FFFFFF" />
              </Animated.View>
              <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                {editing ? 'Changes saved' : isPersonal ? 'Prayer added' : 'Prayer submitted'}
              </Text>
              {!isPersonal ? (
                <Text style={[styles.successText, { color: colors.textMuted }]}>Awaiting review by our team</Text>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexShrink: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  heading: { fontSize: 20, fontWeight: '800' },
  subheading: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  form: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 },
  counter: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11 },
  tileLabel: { fontSize: 14, fontWeight: '800' },
  tileCaption: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '500' },
  textarea: { minHeight: 130, maxHeight: 220, lineHeight: 22 },
  textareaSmall: { minHeight: 56, maxHeight: 90, fontSize: 14 },
  error: { fontSize: 12, fontWeight: '600', marginTop: 5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 6, minHeight: 52 },
  dateBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 14.5, fontWeight: '700' },
  dateReset: { fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  toggleTitle: { fontSize: 14, fontWeight: '700' },
  toggleCaption: { fontSize: 12, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  cancelBtn: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14.5, fontWeight: '700' },
  submitBtn: { flex: 1.6, minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  successOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 18, fontWeight: '800' },
  successText: { fontSize: 13, fontWeight: '500' },
});
