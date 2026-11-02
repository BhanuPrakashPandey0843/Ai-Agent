import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBibleTheme } from "../../hooks/useBibleTheme";
import { getLanguageBible } from "../../data/languageBibles";
import {
  fetchLanguageBibleBooks,
  fetchPublishedLanguageChapter,
  fetchPublishedLanguageChapters,
} from "../../services/languageBibleService";

export default function LanguageBibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useBibleTheme();
  const languageId = route.params?.languageId;
  const language = getLanguageBible(languageId);
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(null);
  const [testament, setTestament] = useState("OT");
  const [chapter, setChapter] = useState(1);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [chapterListVersion, setChapterListVersion] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [picker, setPicker] = useState(null);
  const [bookLoading, setBookLoading] = useState(true);
  const [chapterListLoading, setChapterListLoading] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const previousLanguage = useRef(languageId);
  const activeChapter = useRef(chapter);
  const chapterListKey = `${languageId}:${bookId}:${reloadKey}`;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const book = books.find((item) => item.id === bookId);
  const visibleBooks = books.filter((item) => item.testament === testament);

  useEffect(() => {
    activeChapter.current = chapter;
  }, [chapter]);

  useEffect(() => {
    let active = true;
    setBookLoading(true);
    setError("");
    if (previousLanguage.current !== languageId) {
      previousLanguage.current = languageId;
      setBooks([]);
      setBookId(null);
      setTestament("OT");
      setChapter(1);
      setAvailableChapters([]);
      setChapterListVersion(null);
      setChapterData(null);
    }

    if (!language) {
      setBookLoading(false);
      return undefined;
    }

    fetchLanguageBibleBooks(languageId)
      .then((records) => {
        if (!active) return;
        setBooks(records);
        setBookId((selected) => records.some((item) => item.id === selected)
          ? selected
          : records[0]?.id || null);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load Bible books.");
      })
      .finally(() => {
        if (active) setBookLoading(false);
      });

    return () => {
      active = false;
    };
  }, [languageId, language, reloadKey]);

  useEffect(() => {
    if (!language || !bookId) return undefined;
    let active = true;
    setChapterListLoading(true);
    setChapterListVersion(null);
    setAvailableChapters([]);
    setChapterData(null);
    setError("");

    fetchPublishedLanguageChapters(languageId, bookId)
      .then((records) => {
        if (!active) return;
        setChapterListVersion(chapterListKey);
        setAvailableChapters(records);
        if (records.length && !records.some((record) => record.chapter === activeChapter.current)) {
          setChapter(records[0].chapter);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load the published chapters.");
      })
      .finally(() => {
        if (active) setChapterListLoading(false);
      });

    return () => {
      active = false;
    };
  }, [language, languageId, bookId, reloadKey, chapterListKey]);

  useEffect(() => {
    if (!language || !bookId || chapterListLoading || chapterListVersion !== chapterListKey) {
      return undefined;
    }
    if (!availableChapters.some((record) => Number(record.chapter) === Number(chapter))) {
      setReaderLoading(false);
      setChapterData(null);
      setIsUnavailable(true);
      setError("");
      return undefined;
    }

    let active = true;
    setReaderLoading(true);
    setChapterData(null);
    setIsUnavailable(false);
    setError("");

    fetchPublishedLanguageChapter(languageId, bookId, chapter)
      .then((data) => {
        if (!active) return;
        setChapterData(data);
      })
      .catch((loadError) => {
        if (!active) return;
        if (loadError.code === "chapter/not-published") {
          setIsUnavailable(true);
        } else {
          setError(loadError.message || "Could not load this chapter.");
        }
      })
      .finally(() => {
        if (active) setReaderLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    language,
    languageId,
    bookId,
    chapter,
    chapterListLoading,
    chapterListVersion,
    chapterListKey,
    availableChapters,
    reloadKey,
  ]);

  const selectBook = (nextBook) => {
    setBookId(nextBook.id);
    setTestament(nextBook.testament);
    setChapter(1);
    setPicker(null);
  };

  const changeChapter = (direction) => {
    const candidates = availableChapters
      .map((item) => item.chapter)
      .filter((number) => direction < 0 ? number < chapter : number > chapter);
    if (!candidates.length) return;
    setChapter(direction < 0 ? Math.max(...candidates) : Math.min(...candidates));
  };

  const retry = () => setReloadKey((key) => key + 1);
  const hasPrevious = availableChapters.some((item) => item.chapter < chapter);
  const hasNext = availableChapters.some((item) => item.chapter > chapter);

  if (!language) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.body}>This language reader is unavailable.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.actionText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.toolbarTitles}>
          <Text style={styles.toolbarTitle}>{language.nativeTitle}</Text>
          <Text style={styles.toolbarSubtitle}>{language.title}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh published Bible content"
          onPress={retry}
          style={styles.iconButton}
        >
          <Ionicons name="refresh" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.testamentTabs}>
        {[
          ["OT", "Old Testament"],
          ["NT", "New Testament"],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: testament === value }}
            onPress={() => {
              setTestament(value);
              const firstBook = books.find((item) => item.testament === value);
              if (firstBook) selectBook(firstBook);
            }}
            style={[styles.testamentTab, testament === value && styles.activeTestamentTab]}
          >
            <Text style={[styles.testamentText, testament === value && styles.activeTestamentText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.selectors}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Select book${book ? `, current book ${book.name}` : ""}`}
          style={styles.selector}
          onPress={() => setPicker("book")}
          disabled={!books.length}
        >
          <Text style={styles.selectorLabel}>BOOK</Text>
          <View style={styles.selectorValueRow}>
            <Text style={styles.selectorText} numberOfLines={1}>{book?.name || "Select a book"}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.primary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Select published chapter, current chapter ${chapter}`}
          style={styles.selector}
          onPress={() => setPicker("chapter")}
          disabled={!availableChapters.length}
        >
          <Text style={styles.selectorLabel}>CHAPTER</Text>
          <View style={styles.selectorValueRow}>
            <Text style={styles.selectorText}>Chapter {chapter}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        key={`${languageId}-${bookId}-${chapter}`}
        style={styles.reader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {bookLoading || chapterListLoading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.stateText}>Loading {language.title}…</Text>
          </View>
        ) : error ? (
          <View style={styles.statePanel}>
            <Ionicons name="cloud-offline-outline" size={28} color={theme.primary} />
            <Text style={styles.stateTitle}>Could not load Bible content</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={retry} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : readerLoading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.stateText}>Loading published verses…</Text>
          </View>
        ) : isUnavailable || !availableChapters.length ? (
          <View style={styles.statePanel}>
            <Ionicons name="book-outline" size={30} color={theme.primary} />
            <Text style={styles.stateTitle}>
              {!availableChapters.length && book
                ? `No ${language.title} chapters published for ${book.name} yet`
                : "This chapter is not available yet."}
            </Text>
            <Text style={styles.stateText}>
              Published chapters will appear here when they are ready.
            </Text>
          </View>
        ) : chapterData ? (
          <>
            <Text style={styles.chapterEyebrow}>{language.nativeTitle} · {book?.testament === "OT" ? "Old Testament" : "New Testament"}</Text>
            <Text style={styles.chapterHeading}>{book?.name || chapterData.bookName} {chapter}</Text>
            <View style={styles.verseList}>
              {chapterData.verses.map((verse) => (
                <Text key={verse.number} style={styles.verseText}>
                  <Text style={styles.verseNumber}>{verse.number} </Text>
                  {verse.text}
                </Text>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!hasPrevious || readerLoading}
          onPress={() => changeChapter(-1)}
          style={[styles.chapterButton, (!hasPrevious || readerLoading) && styles.disabledButton]}
        >
          <Ionicons name="arrow-back" size={16} color={theme.text} />
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.footerMeta}>{availableChapters.length ? `${availableChapters.length} available` : ""}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!hasNext || readerLoading}
          onPress={() => changeChapter(1)}
          style={[styles.chapterButton, (!hasNext || readerLoading) && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={!!picker}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPicker(null)}>
          <Pressable style={styles.picker} onPress={() => {}}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {picker === "book" ? "Choose a book" : `Published chapters · ${book?.name || ""}`}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close selection"
                onPress={() => setPicker(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={21} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {picker === "book" ? (
                visibleBooks.map((item) => {
                  const count = item.id === bookId ? availableChapters.length : null;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.bookOption}
                      onPress={() => selectBook(item)}
                    >
                      <Text style={styles.optionText}>{item.name}</Text>
                      <Text style={styles.optionMeta}>
                        {count === null ? `${item.chapters} expected` : `${count} available`}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : availableChapters.length ? (
                <View style={styles.chapterGrid}>
                  {availableChapters.map((item) => (
                    <TouchableOpacity
                      key={item.chapter}
                      accessibilityRole="button"
                      accessibilityLabel={`Chapter ${item.chapter}, published`}
                      accessibilityState={{ selected: item.chapter === chapter }}
                      style={[
                        styles.chapterOption,
                        item.chapter === chapter && styles.activeChapterOption,
                      ]}
                      onPress={() => {
                        setChapter(item.chapter);
                        setPicker(null);
                      }}
                    >
                      <Text style={styles.optionText}>{item.chapter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyPicker}>No chapters published yet.</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    centered: { alignItems: "center", justifyContent: "center", padding: 24 },
    toolbar: {
      minHeight: 58,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    toolbarTitles: { flex: 1, alignItems: "center" },
    toolbarTitle: { fontSize: 17, fontWeight: "800", color: theme.text },
    toolbarSubtitle: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    testamentTabs: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 14,
      padding: 4,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    testamentTab: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 9 },
    activeTestamentTab: { backgroundColor: theme.isDark ? "rgba(225,138,58,0.2)" : "rgba(201,106,27,0.13)" },
    testamentText: { fontSize: 12, fontWeight: "600", color: theme.textMuted },
    activeTestamentText: { color: theme.primary, fontWeight: "800" },
    selectors: { flexDirection: "row", gap: 10, padding: 16 },
    selector: {
      flex: 1,
      minWidth: 0,
      minHeight: 60,
      paddingHorizontal: 12,
      paddingVertical: 8,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    selectorLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, color: theme.textMuted },
    selectorValueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: 4 },
    selectorText: { flexShrink: 1, fontSize: 13, fontWeight: "700", color: theme.text },
    reader: { flex: 1 },
    content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 },
    chapterEyebrow: { color: theme.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
    chapterHeading: { color: theme.text, fontSize: 24, fontWeight: "800", marginTop: 5, marginBottom: 22 },
    verseList: { gap: 15 },
    verseText: { color: theme.text, fontSize: 19, lineHeight: 34, fontWeight: "400" },
    verseNumber: { color: theme.primary, fontSize: 13, fontWeight: "800" },
    statePanel: {
      minHeight: 210,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      backgroundColor: theme.surface,
    },
    stateTitle: { marginTop: 12, color: theme.text, fontSize: 16, fontWeight: "800", textAlign: "center" },
    stateText: { marginTop: 7, color: theme.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center" },
    retryButton: { marginTop: 16, minHeight: 40, justifyContent: "center", paddingHorizontal: 18, borderRadius: 10, backgroundColor: theme.primary },
    retryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
    footer: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    chapterButton: {
      minWidth: 110,
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 13,
      backgroundColor: theme.surface,
    },
    disabledButton: { opacity: 0.42 },
    buttonText: { color: theme.text, fontSize: 13, fontWeight: "700" },
    footerMeta: { flex: 1, textAlign: "center", color: theme.textMuted, fontSize: 11 },
    body: { color: theme.text, fontSize: 16, textAlign: "center" },
    backButton: { padding: 14, marginTop: 12 },
    actionText: { color: theme.primary, fontWeight: "700" },
    backdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.5)" },
    picker: { maxHeight: "80%", overflow: "hidden", borderRadius: 18, backgroundColor: theme.surface },
    pickerHeader: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    pickerTitle: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" },
    closeButton: { width: 40, height: 44, alignItems: "flex-end", justifyContent: "center" },
    bookOption: {
      minHeight: 52,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    optionText: { color: theme.text, fontSize: 14, fontWeight: "600" },
    optionMeta: { color: theme.textMuted, fontSize: 12 },
    chapterGrid: { flexDirection: "row", flexWrap: "wrap", padding: 10 },
    chapterOption: { width: "20%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 12 },
    activeChapterOption: { backgroundColor: theme.isDark ? "rgba(225,138,58,0.2)" : "rgba(201,106,27,0.14)" },
    emptyPicker: { padding: 20, color: theme.textMuted, textAlign: "center", fontSize: 13 },
  });
}
