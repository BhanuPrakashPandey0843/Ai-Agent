// src/screens/WritePrayerScreen.js
// Premium "Write a Prayer" form — submits to Firestore: userPrayers.
// Drafts are persisted locally via AsyncStorage so users never lose work.
// Includes word counter, category chips, anonymous toggle, loading + success states,
// accessibility labels, and proper keyboard handling.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackHeader from '../components/common/BackHeader';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { createUserPrayer } from '../services/firebaseService';
import {
  clearPrayerDraft,
  getPrayerDraft,
  savePrayerDraft,
} from '../storage';
import { STORAGE_KEYS, USER_PRAYER_CATEGORIES } from '../constants';

const MAX_WORDS = 500;
const MAX_TITLE_CHARS = 120;
const MAX_DESCRIPTION_CHARS = 300;

const countWords = (text) => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};

export default function WritePrayerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { showToast } = useToast();
  const { user, userProfile } = useAuth();

  const accent = colors.primary;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const contentRef = useRef(null);
  const draftDebounce = useRef(null);

  // ─── Load draft on mount ───────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const draft = await getPrayerDraft(STORAGE_KEYS.PRAYER_DRAFT);
        if (active && draft && !submitting) {
          setTitle(draft.title || '');
          setDescription(draft.description || '');
          setCategory(draft.category || null);
          setContent(draft.content || '');
          setAnonymous(draft.anonymous === true);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ─── Autosave draft (debounced) ───────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    if (submitting) return;
    if (draftDebounce.current) clearTimeout(draftDebounce.current);
    draftDebounce.current = setTimeout(async () => {
      try {
        if (!title && !description && !category && !content && !anonymous) {
          await clearPrayerDraft(STORAGE_KEYS.PRAYER_DRAFT);
          return;
        }
        await savePrayerDraft(STORAGE_KEYS.PRAYER_DRAFT, {
          title,
          description,
          category,
          content,
          anonymous,
        });
      } catch {
        // silently ignore
      }
    }, 600);
    return () => {
      if (draftDebounce.current) clearTimeout(draftDebounce.current);
    };
  }, [loaded, submitting, title, description, category, content, anonymous]);

  // ─── Derived validation / word state ──────────────────────────────────────
  const wordCount = useMemo(() => countWords(content), [content]);
  const overWordLimit = wordCount > MAX_WORDS;
  const wordsRemaining = MAX_WORDS - wordCount;

  const validationErrors = useMemo(() => {
    const errors = [];
    if (!title.trim()) errors.push('Please enter a prayer title');
    else if (title.length > MAX_TITLE_CHARS)
      errors.push(`Title must be ${MAX_TITLE_CHARS} characters or fewer`);
    if (description.length > MAX_DESCRIPTION_CHARS)
      errors.push(`Description must be ${MAX_DESCRIPTION_CHARS} characters or fewer`);
    if (!category) errors.push('Please select a category');
    if (!content.trim()) errors.push('Please write your prayer');
    else if (overWordLimit)
      errors.push(`Prayer exceeds the ${MAX_WORDS} word limit by ${-wordsRemaining} word(s)`);
    return errors;
  }, [title, description, category, content, overWordLimit, wordsRemaining]);

  const canSubmit = validationErrors.length === 0 && !submitting && user;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (savingDraft) return;
    setSavingDraft(true);
    try {
      await savePrayerDraft(STORAGE_KEYS.PRAYER_DRAFT, {
        title,
        description,
        category,
        content,
        anonymous,
      });
      showToast('Draft saved', 'success', 1800);
    } catch {
      showToast('Could not save draft', 'error');
    } finally {
      setSavingDraft(false);
    }
  }, [savingDraft, title, description, category, content, anonymous, showToast]);

  const handleDiscard = useCallback(() => {
    Alert.alert('Discard Prayer?', 'Your unsaved changes and draft will be deleted.', [
      { text: 'Keep Writing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearPrayerDraft(STORAGE_KEYS.PRAYER_DRAFT);
          } catch {
            // ignore
          }
          navigation.goBack();
        },
      },
    ]);
  }, [navigation]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const username = anonymous ? 'Anonymous' : (userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Believer');
      await createUserPrayer({
        userId: user.uid,
        title: title.trim(),
        description: description.trim(),
        category,
        content: content.trim(),
        anonymous,
        username,
      });
      try {
        await clearPrayerDraft(STORAGE_KEYS.PRAYER_DRAFT);
      } catch {
        // ignore
      }
      showToast('Your prayer request has been submitted successfully and is awaiting approval.', 'success', 3800);
      setTitle('');
      setDescription('');
      setCategory(null);
      setContent('');
      setAnonymous(false);
      setTimeout(() => {
        if (navigation.canGoBack()) navigation.goBack();
      }, 500);
    } catch (err) {
      const msg = err?.message?.includes('permission') || err?.message?.includes('PERMISSION_DENIED')
        ? 'You need to be signed in to submit a prayer.'
        : err?.message || 'Could not send prayer. Please try again.';
      showToast(msg, 'error', 4000);
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    user,
    userProfile,
    title,
    description,
    category,
    content,
    anonymous,
    showToast,
    navigation,
  ]);

  const renderCategoryChip = useCallback(
    (cat) => {
      const selected = category === cat;
      return (
        <TouchableOpacity
          key={cat}
          activeOpacity={0.8}
          onPress={() => setCategory(cat)}
          accessibilityLabel={`Category ${cat}`}
          accessibilityState={{ selected }}
          style={[
            styles.chip,
            {
              borderColor: selected ? accent : colors.border,
              backgroundColor: selected ? accent + '15' : colors.bgCard,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: selected ? accent : colors.textPrimary },
              selected && { fontWeight: '700' },
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      );
    },
    [category, accent, colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <BackHeader title="Write a Prayer" onBackPress={handleDiscard} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: insets.bottom + 120,
              paddingHorizontal: 20,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header intro */}
            <View style={{ marginBottom: 24 }}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                Speak from the Heart
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                Write your prayer and send it to our community.
              </Text>
            </View>

            {/* Title */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Prayer Title <Text style={{ color: '#f44336' }}>*</Text>
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter prayer title"
                placeholderTextColor={colors.textMuted}
                maxLength={MAX_TITLE_CHARS}
                returnKeyType="next"
                accessibilityLabel="Prayer title"
                onSubmitEditing={() => contentRef.current?.focus()}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {title.length}/{MAX_TITLE_CHARS}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Short Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Briefly describe your prayer"
                placeholderTextColor={colors.textMuted}
                maxLength={MAX_DESCRIPTION_CHARS}
                multiline
                returnKeyType="next"
                numberOfLines={2}
                accessibilityLabel="Prayer description"
                style={[
                  styles.textareaSmall,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {description.length}/{MAX_DESCRIPTION_CHARS}
                </Text>
              </View>
            </View>

            {/* Category */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Category <Text style={{ color: '#f44336' }}>*</Text>
              </Text>
              <View style={styles.chipWrap}>{USER_PRAYER_CATEGORIES.map(renderCategoryChip)}</View>
            </View>

            {/* Content */}
            <View style={{ marginBottom: 20 }}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  Prayer Content <Text style={{ color: '#f44336' }}>*</Text>
                </Text>
                <Text
                  style={[
                    styles.wordCount,
                    { color: overWordLimit ? '#f44336' : colors.textMuted },
                    !overWordLimit && wordsRemaining <= 50 && { color: accent, fontWeight: '700' },
                  ]}
                >
                  {overWordLimit
                    ? `${-wordsRemaining} over limit`
                    : `${wordsRemaining} words remaining`}
                </Text>
              </View>
              <TextInput
                ref={contentRef}
                value={content}
                onChangeText={setContent}
                placeholder="Write your prayer here..."
                placeholderTextColor={colors.textMuted}
                multiline
                scrollEnabled
                numberOfLines={14}
                textAlignVertical="top"
                accessibilityLabel="Prayer content"
                style={[
                  styles.textarea,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: overWordLimit ? '#f4433680' : colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Anonymous toggle */}
            <View
              style={[
                styles.toggleRow,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                  Anonymous Prayer
                </Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>
                  Hide your name from the public when approved.
                </Text>
              </View>
              <Switch
                value={anonymous}
                onValueChange={setAnonymous}
                trackColor={{ false: isDark ? '#2A2A2A' : '#E5E7EB', true: accent + '80' }}
                thumbColor={anonymous ? accent : (isDark ? '#8A8A8A' : '#F9FAFB')}
                accessibilityLabel="Anonymous prayer toggle"
              />
            </View>

            {/* Validation summary */}
            {loaded && validationErrors.length > 0 ? (
              <View style={[styles.errorsBox, { borderColor: '#f4433650', backgroundColor: colors.bgCard }]}>
                {validationErrors.map((e, i) => (
                  <View key={i} style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#f44336" />
                    <Text style={[styles.errorText, { color: '#f44336' }]}>{e}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </Pressable>

        {/* Bottom action bar */}
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.bg,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { borderColor: colors.border, backgroundColor: colors.bgCard },
            ]}
            onPress={handleSaveDraft}
            disabled={savingDraft || submitting || !loaded}
            accessibilityLabel="Save draft"
            activeOpacity={0.8}
          >
            {savingDraft ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Ionicons name="save-outline" size={18} color={accent} />
            )}
            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
              {savingDraft ? 'Saving…' : 'Save Draft'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? accent : accent + '50' },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || savingDraft}
            accessibilityLabel="Send prayer"
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="paper-plane" size={18} color="#fff" />
            )}
            <Text style={styles.submitText}>
              {submitting ? 'Sending…' : 'Send Prayer'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  wordCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  textareaSmall: {
    minHeight: 62,
    maxHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  textarea: {
    minHeight: 260,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 4,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  errorsBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1.5,
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
