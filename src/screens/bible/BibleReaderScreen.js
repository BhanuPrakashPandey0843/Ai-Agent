import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fetchChapter } from '../../services/bibleService';
import { getBookById, FONT_SIZES, READING_THEMES } from '../../constants/bible';
import { useBible } from '../../context/BibleContext';
import { useBibleTheme } from '../../hooks/useBibleTheme';
import MiniAudioPlayer from '../../components/bible/MiniAudioPlayer';

export default function BibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useBibleTheme();
  const {
    settings,
    readerTheme,
    updateSettings,
    trackReading,
    toggleBookmark,
    highlightVerse,
    playChapterAudio,
    audio,
  } = useBible();

  const bookId = route.params?.bookId;
  const chapter = route.params?.chapter || 1;
  const scrollVerse = route.params?.verse || 1;
  const book = getBookById(bookId);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const activeTheme = READING_THEMES[settings?.themeId] || readerTheme;
  const fontSize = settings?.fontSize || 18;
  const styles = useMemo(
    () => createStyles(activeTheme, fontSize),
    [activeTheme, fontSize],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chapterData = await fetchChapter(bookId, chapter);
      setData(chapterData);
      await trackReading(bookId, chapter, scrollVerse);
    } catch (err) {
      setError(err.message || 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  }, [bookId, chapter, scrollVerse, trackReading]);

  useEffect(() => {
    load();
  }, [load]);

  const onVerseLongPress = async (verse) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVerse(verse);
  };

  const handleAction = async (action) => {
    if (!selectedVerse || !book) return;
    const ref = `${book.name} ${chapter}:${selectedVerse.number}`;
    const text = `"${selectedVerse.text}" — ${ref}`;

    switch (action) {
      case 'copy':
        await Clipboard.setStringAsync(text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'share':
        await Share.share({ message: text });
        break;
      case 'bookmark':
        await toggleBookmark({
          bookId,
          chapter,
          verse: selectedVerse.number,
          reference: ref,
          text: selectedVerse.text,
        });
        break;
      case 'highlight':
        await highlightVerse(bookId, chapter, selectedVerse.number);
        break;
      case 'note':
        navigation.navigate('BibleNotes', {
          draft: {
            bookId,
            chapter,
            verse: selectedVerse.number,
            reference: ref,
            text: selectedVerse.text,
          },
        });
        break;
      default:
        break;
    }
    setSelectedVerse(null);
  };

  const goToPrevChapter = () => {
    if (chapter <= 1) return;
    navigation.replace('BibleReader', { bookId, chapter: chapter - 1, verse: 1 });
  };

  const goToNextChapter = () => {
    if (!book || chapter >= book.chapters) return;
    navigation.replace('BibleReader', { bookId, chapter: chapter + 1, verse: 1 });
  };

  if (!book) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Unknown Bible book.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={activeTheme.accent} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Chapter unavailable'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.toolBtn}
        >
          <Ionicons name="chevron-back" size={24} color={activeTheme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.toolbarTitle}>{book.name}</Text>
          <Text style={styles.toolbarSub}>Chapter {chapter}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.toolBtn}
        >
          <Ionicons name="text" size={20} color={activeTheme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            playChapterAudio(bookId, chapter, settings?.audioSpeed || 1)
          }
          style={styles.toolBtn}
        >
          <Ionicons name="volume-high-outline" size={20} color={activeTheme.text} />
        </TouchableOpacity>
      </View>

      {/* ── Verses ── */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + (audio.playing ? 180 : 120),
        }}
      >
        <Text style={styles.chapterHeading}>Chapter {chapter}</Text>
        {data.verses.map((verse) => (
          <Pressable
            key={verse.number}
            onLongPress={() => onVerseLongPress(verse)}
            style={styles.verseRow}
          >
            <Text style={styles.verseNum}>{verse.number}</Text>
            <Text style={styles.verseText}>{verse.text}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Chapter Navigation ── */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          disabled={chapter <= 1}
          onPress={goToPrevChapter}
          style={[styles.navBtn, chapter <= 1 && styles.navBtnDisabled]}
        >
          <Text style={styles.navBtnText}>← Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={chapter >= book.chapters}
          onPress={goToNextChapter}
          style={[styles.navBtn, chapter >= book.chapters && styles.navBtnDisabled]}
        >
          <Text style={styles.navBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>

      <MiniAudioPlayer bottomInset={insets.bottom} />

      {/* ── Verse Action Sheet ── */}
      <Modal
        visible={!!selectedVerse}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVerse(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelectedVerse(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetRef}>
              {book.name} {chapter}:{selectedVerse?.number}
            </Text>
            {[
              { action: 'bookmark', label: 'Bookmark' },
              { action: 'highlight', label: 'Highlight' },
              { action: 'copy',     label: 'Copy'      },
              { action: 'share',    label: 'Share'     },
              { action: 'note',     label: 'Add Note'  },
            ].map(({ action, label }) => (
              <TouchableOpacity
                key={action}
                style={styles.sheetAction}
                onPress={() => handleAction(action)}
              >
                <Text style={styles.sheetActionText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Reader Settings Sheet ── */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setShowSettings(false)}
        >
          <View style={styles.settingsSheet}>
            <Text style={styles.settingsTitle}>Reader Settings</Text>

            <Text style={styles.settingsLabel}>Font size</Text>
            <View style={styles.rowWrap}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.chip, fontSize === size && styles.chipActive]}
                  onPress={() => updateSettings({ fontSize: size })}
                >
                  <Text style={styles.chipText}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingsLabel}>Theme</Text>
            <View style={styles.rowWrap}>
              {Object.values(READING_THEMES).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.chip,
                    settings?.themeId === t.id && styles.chipActive,
                  ]}
                  onPress={() => updateSettings({ themeId: t.id })}
                >
                  <Text style={styles.chipText}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme, fontSize) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    toolBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbarTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    toolbarSub: { fontSize: 12, color: theme.muted },
    chapterHeading: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 16,
    },
    verseRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    verseNum: {
      width: 28,
      fontSize: 12,
      fontWeight: '800',
      color: theme.accent,
      marginTop: 4,
    },
    verseText: { flex: 1, fontSize, lineHeight: fontSize * 1.55, color: theme.text },
    footerNav: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.06)',
    },
    navBtn: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontWeight: '700', color: theme.text },
    errorText: {
      color: theme.muted,
      textAlign: 'center',
      marginBottom: 12,
      fontSize: 15,
    },
    retryBtn: {
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    retryText: { color: '#FFF', fontWeight: '700' },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    sheetRef: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 12,
    },
    sheetAction: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    sheetActionText: { fontSize: 16, fontWeight: '600', color: theme.text },
    settingsSheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    settingsTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 16,
    },
    settingsLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.muted,
      marginTop: 8,
      marginBottom: 8,
    },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.bg,
    },
    chipActive: { backgroundColor: `${theme.accent}33` },
    chipText: { fontSize: 13, fontWeight: '700', color: theme.text },
  });
}
