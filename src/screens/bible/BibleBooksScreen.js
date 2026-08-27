import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getBooksByTestament } from '../../constants/bible';
import { useBible } from '../../context/BibleContext';
import { useBiblePremiumTheme } from '../../hooks/useBiblePremiumTheme';
import CircleIconButton from '../../components/common/CircleIconButton';

// Groups rendered in this fixed order per testament (OT gets nested
// group -> book -> chapter accordion; NT is a flat book accordion).
const OT_GROUP_ORDER = ['Law', 'History', 'Poetry', 'Major Prophets', 'Minor Prophets'];
const NT_GROUP_ORDER = ['Gospels', 'History', 'Letters', 'Prophecy'];

function groupBooks(books, order) {
  const byGroup = new Map();
  books.forEach((b) => {
    if (!byGroup.has(b.group)) byGroup.set(b.group, []);
    byGroup.get(b.group).push(b);
  });
  return order
    .filter((g) => byGroup.has(g))
    .map((g) => ({ group: g, items: byGroup.get(g) }));
}

// Deterministic "today's reading" — walks the testament's chapters in
// canonical order and picks one based on the real day-of-year, so it's
// stable for the whole day and cycles through the whole testament.
function getDailyReading(books) {
  const total = books.reduce((sum, b) => sum + b.chapters, 0);
  if (!total) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  let remaining = dayOfYear % total;
  for (const book of books) {
    if (remaining < book.chapters) {
      return { day: dayOfYear, book, chapter: remaining + 1 };
    }
    remaining -= book.chapters;
  }
  return { day: dayOfYear, book: books[0], chapter: 1 };
}

export default function BibleBooksScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useBiblePremiumTheme();
  const { continueReading, readChapters } = useBible();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const initial = route.params?.testament || 'OT';
  const [testament, setTestament] = useState(initial);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [expandedBook, setExpandedBook] = useState(null);

  const books = useMemo(() => getBooksByTestament(testament), [testament]);
  const groupOrder = testament === 'OT' ? OT_GROUP_ORDER : NT_GROUP_ORDER;
  const groups = useMemo(() => groupBooks(books, groupOrder), [books, groupOrder]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return books.filter((b) => b.name.toLowerCase().includes(q));
  }, [books, query]);

  const totalChapters = useMemo(() => books.reduce((s, b) => s + b.chapters, 0), [books]);
  const readCount = useMemo(
    () =>
      books.reduce(
        (s, b) => s + Math.min(readChapters?.[b.id]?.length || 0, b.chapters),
        0
      ),
    [books, readChapters]
  );
  const pct = totalChapters ? Math.round((readCount / totalChapters) * 100) : 0;

  const continueInTestament = useMemo(() => {
    if (!continueReading) return null;
    const book = books.find((b) => b.id === continueReading.bookId);
    return book ? { book, chapter: continueReading.chapter } : null;
  }, [books, continueReading]);

  const dailyReading = useMemo(() => getDailyReading(books), [books]);

  const switchTestament = useCallback((t) => {
    setTestament(t);
    setExpandedGroup(null);
    setExpandedBook(null);
    setQuery('');
  }, []);

  const toggleGroup = useCallback((key) => {
    Haptics.selectionAsync();
    setExpandedGroup((prev) => (prev === key ? null : key));
  }, []);

  const toggleBook = useCallback((id) => {
    Haptics.selectionAsync();
    setExpandedBook((prev) => (prev === id ? null : id));
  }, []);

  const openChapter = useCallback(
    (bookId, chapter) => {
      navigation.navigate('BibleReader', { bookId, chapter });
    },
    [navigation]
  );

  const shareTestament = useCallback(async () => {
    const label = testament === 'NT' ? 'New Testament' : 'Old Testament';
    await Share.share({
      message: `I'm reading through the ${label} — ${pct}% complete (${readCount}/${totalChapters} chapters) on Faith Frames.`,
    });
  }, [testament, pct, readCount, totalChapters]);

  const testamentLabel = testament === 'NT' ? 'New Testament' : 'Old Testament';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <CircleIconButton
          size={40}
          backgroundColor={theme.surface}
          borderColor={theme.border}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </CircleIconButton>

        <Text style={styles.headerTitle} numberOfLines={1}>{testamentLabel}</Text>

        <View style={styles.headerActions}>
          <CircleIconButton
            size={40}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            onPress={() => setSearchOpen((v) => !v)}
          >
            <Ionicons name={searchOpen ? 'close' : 'search'} size={18} color={theme.text} />
          </CircleIconButton>
          <CircleIconButton
            size={40}
            backgroundColor={theme.surface}
            borderColor={theme.border}
            onPress={shareTestament}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="share-outline" size={18} color={theme.text} />
          </CircleIconButton>
        </View>
      </View>

      {searchOpen ? (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} style={styles.searchRow}>
          <Ionicons name="search" size={16} color={theme.textFaint} />
          <TextInput
            autoFocus
            style={styles.searchInput}
            placeholder="Search chapter, book..."
            placeholderTextColor={theme.textFaint}
            value={query}
            onChangeText={setQuery}
          />
        </Animated.View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Testament switch */}
        <View style={styles.tabRow}>
          {['OT', 'NT'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, testament === t && styles.tabActive]}
              onPress={() => switchTestament(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, testament === t && styles.tabTextActive]}>
                {t === 'OT' ? 'Old Testament' : 'New Testament'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!query.trim() && (
          <Animated.View entering={FadeIn.duration(300)}>
            {/* Reading progress card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressTitle}>{testamentLabel}</Text>
                <Text style={styles.progressPct}>{pct}% Complete</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressMeta}>
                {readCount} / {totalChapters} Chapters Read
              </Text>

              {continueInTestament ? (
                <TouchableOpacity
                  style={styles.continueBtn}
                  activeOpacity={0.9}
                  onPress={() => openChapter(continueInTestament.book.id, continueInTestament.chapter)}
                >
                  <Text style={styles.continueBtnText}>
                    Continue · {continueInTestament.book.name} {continueInTestament.chapter}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.isDark ? '#161208' : '#FFFFFF'} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.continueBtn}
                  activeOpacity={0.9}
                  onPress={() => openChapter(books[0]?.id, 1)}
                >
                  <Text style={styles.continueBtnText}>Start Reading</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.isDark ? '#161208' : '#FFFFFF'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Daily reading */}
            {dailyReading ? (
              <View style={styles.dailyCard}>
                <View style={styles.dailyBadge}>
                  <MaterialCommunityIcons name="calendar-star" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dailyDay}>Day {dailyReading.day}</Text>
                  <Text style={styles.dailyRef}>{dailyReading.book.name} {dailyReading.chapter}</Text>
                </View>
                <TouchableOpacity
                  style={styles.readNowBtn}
                  onPress={() => openChapter(dailyReading.book.id, dailyReading.chapter)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.readNowText}>Read Now</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Animated.View>
        )}

        {/* Book / group accordion */}
        <View style={{ marginTop: 8 }}>
          {filteredBooks ? (
            filteredBooks.length ? (
              filteredBooks.map((book) => (
                <BookRow
                  key={book.id}
                  book={book}
                  theme={theme}
                  expanded={expandedBook === book.id}
                  onToggle={() => toggleBook(book.id)}
                  onOpenChapter={openChapter}
                  readChapters={readChapters?.[book.id] || []}
                  currentChapter={continueReading?.bookId === book.id ? continueReading.chapter : null}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No books match "{query}"</Text>
            )
          ) : testament === 'OT' ? (
            groups.map((g) => (
              <GroupSection
                key={g.group}
                group={g.group}
                books={g.items}
                theme={theme}
                expandedGroup={expandedGroup === g.group}
                onToggleGroup={() => toggleGroup(g.group)}
                expandedBook={expandedBook}
                onToggleBook={toggleBook}
                onOpenChapter={openChapter}
                readChapters={readChapters}
                continueReading={continueReading}
              />
            ))
          ) : (
            books.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                theme={theme}
                expanded={expandedBook === book.id}
                onToggle={() => toggleBook(book.id)}
                onOpenChapter={openChapter}
                readChapters={readChapters?.[book.id] || []}
                currentChapter={continueReading?.bookId === book.id ? continueReading.chapter : null}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function GroupSection({
  group,
  books,
  theme,
  expandedGroup,
  onToggleGroup,
  expandedBook,
  onToggleBook,
  onOpenChapter,
  readChapters,
  continueReading,
}) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const readInGroup = books.reduce(
    (s, b) => s + Math.min(readChapters?.[b.id]?.length || 0, b.chapters),
    0
  );
  const totalInGroup = books.reduce((s, b) => s + b.chapters, 0);

  return (
    <Animated.View layout={Layout.springify().damping(18)} style={styles.groupWrap}>
      <TouchableOpacity style={styles.groupHeader} onPress={onToggleGroup} activeOpacity={0.85}>
        <Text style={styles.groupTitle}>{group}</Text>
        <View style={styles.groupHeaderRight}>
          <Text style={styles.groupMeta}>{readInGroup}/{totalInGroup}</Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color={theme.textFaint}
            style={{ transform: [{ rotate: expandedGroup ? '180deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {expandedGroup ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.groupBody}>
          {books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              theme={theme}
              nested
              expanded={expandedBook === book.id}
              onToggle={() => onToggleBook(book.id)}
              onOpenChapter={onOpenChapter}
              readChapters={readChapters?.[book.id] || []}
              currentChapter={continueReading?.bookId === book.id ? continueReading.chapter : null}
            />
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function BookRow({ book, theme, expanded, onToggle, onOpenChapter, readChapters, currentChapter, nested }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const readSet = useMemo(() => new Set(readChapters), [readChapters]);
  const chapters = useMemo(() => Array.from({ length: book.chapters }, (_, i) => i + 1), [book.chapters]);

  return (
    <Animated.View layout={Layout.springify().damping(18)} style={[styles.bookWrap, nested && styles.bookWrapNested]}>
      <TouchableOpacity style={styles.bookHeader} onPress={onToggle} activeOpacity={0.85}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookName}>{book.name}</Text>
          <Text style={styles.bookMeta}>{book.chapters} Chapters</Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.textFaint}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {expanded ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(130)} style={styles.pillGrid}>
          {chapters.map((ch) => {
            const isCurrent = currentChapter === ch;
            const isRead = readSet.has(ch);
            return (
              <TouchableOpacity
                key={ch}
                style={[
                  styles.pill,
                  isRead && styles.pillRead,
                  isCurrent && styles.pillCurrent,
                ]}
                onPress={() => onOpenChapter(book.id, ch)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    isRead && styles.pillTextRead,
                    isCurrent && styles.pillTextCurrent,
                  ]}
                >
                  {ch}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 14,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      marginHorizontal: 8,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: theme.surface,
      borderRadius: theme.radiusSm,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
    },
    searchInput: { flex: 1, paddingVertical: 12, color: theme.text, fontSize: 14 },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 4 },
    tab: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: theme.radiusSm,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    tabActive: { backgroundColor: theme.primarySoft, borderColor: theme.primary },
    tabText: { fontSize: 12.5, fontWeight: '700', color: theme.textMuted },
    tabTextActive: { color: theme.primary },
    progressCard: {
      backgroundColor: theme.surface,
      borderRadius: theme.radius,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      marginBottom: 16,
    },
    progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    progressPct: { fontSize: 13, fontWeight: '700', color: theme.primary },
    progressTrack: {
      height: 7,
      backgroundColor: theme.divider,
      borderRadius: 999,
      marginTop: 12,
      overflow: 'hidden',
    },
    progressFill: { height: 7, borderRadius: 999, backgroundColor: theme.primary },
    progressMeta: { fontSize: 12, color: theme.textMuted, marginTop: 8 },
    continueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: theme.radiusSm,
      paddingVertical: 13,
      marginTop: 16,
    },
    continueBtnText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: theme.isDark ? '#161208' : '#FFFFFF',
    },
    dailyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.surface,
      borderRadius: theme.radius,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    dailyBadge: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dailyDay: { fontSize: 11, fontWeight: '700', color: theme.textFaint, textTransform: 'uppercase', letterSpacing: 0.4 },
    dailyRef: { fontSize: 15, fontWeight: '800', color: theme.text, marginTop: 2 },
    readNowBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    readNowText: { fontSize: 12, fontWeight: '800', color: theme.primary },
    emptyText: { textAlign: 'center', color: theme.textMuted, marginTop: 40, fontSize: 13.5 },

    groupWrap: {
      backgroundColor: theme.surface,
      borderRadius: theme.radius,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
      overflow: 'hidden',
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    groupTitle: { fontSize: 15, fontWeight: '800', color: theme.text },
    groupHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    groupMeta: { fontSize: 11.5, color: theme.textFaint, fontWeight: '600' },
    groupBody: {
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    bookWrap: {
      backgroundColor: theme.surface,
      borderRadius: theme.radiusSm,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
      overflow: 'hidden',
    },
    bookWrapNested: {
      backgroundColor: theme.surfaceAlt,
      marginBottom: 8,
      borderColor: theme.divider,
    },
    bookHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    bookName: { fontSize: 14.5, fontWeight: '800', color: theme.text },
    bookMeta: { fontSize: 11.5, color: theme.textMuted, marginTop: 2 },
    pillGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      paddingTop: 12,
    },
    pill: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pillRead: {
      backgroundColor: theme.successSoft,
      borderColor: 'transparent',
    },
    pillCurrent: {
      backgroundColor: theme.primary,
      borderColor: 'transparent',
    },
    pillText: { fontSize: 13, fontWeight: '700', color: theme.textMuted },
    pillTextRead: { color: theme.success },
    pillTextCurrent: { color: theme.isDark ? '#161208' : '#FFFFFF' },
  });
}
