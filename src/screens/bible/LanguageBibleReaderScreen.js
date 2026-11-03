import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Pressable,
  Platform,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useBibleTheme } from "../../hooks/useBibleTheme";
import { getLanguageBible } from "../../data/languageBibles";
import { useBible } from "../../context/BibleContext";
import {
  fetchLanguageBibleBooks,
  fetchLanguageBibleChapter,
  fetchLanguageBibleChapters,
  searchLanguageBible,
} from "../../services/languageBibleService";
import { saveSelectedBibleLanguage } from "../../storage/bibleStorage";

export default function LanguageBibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useBibleTheme();
  const { bookmarks, highlights, settings, updateSettings, toggleBookmark, highlightVerse, trackLanguageReading } = useBible();
  const languageId = route.params?.languageId;
  const language = getLanguageBible(languageId);
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(route.params?.bookId || null);
  const [testament, setTestament] = useState("OT");
  const [chapter, setChapter] = useState(Number(route.params?.chapter) || 1);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [chapterListVersion, setChapterListVersion] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [picker, setPicker] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [pendingVerse, setPendingVerse] = useState(Number(route.params?.verse) || null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [toast, setToast] = useState("");
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
  const fontSize = Math.min(28, Math.max(14, Number(settings?.fontSize) || 18));
  const highlightedVerse = selectedVerse
    ? highlights[`${languageId}_${bookId}_${chapter}_${selectedVerse.number}`]
    : null;
  const bookmarkedVerse = selectedVerse && bookmarks.some((item) => (
    item.languageId === languageId
    && item.bookId === bookId
    && Number(item.chapter) === Number(chapter)
    && Number(item.verse) === Number(selectedVerse.number)
  ));
  const toastTimer = useRef(null);

  useEffect(() => {
    activeChapter.current = chapter;
  }, [chapter]);

  useEffect(() => {
    if (languageId && language) saveSelectedBibleLanguage(languageId);
  }, [languageId, language]);

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
      setBookId(route.params?.bookId || null);
      setChapter(Number(route.params?.chapter) || 1);
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
          : records.some((item) => item.id === route.params?.bookId)
            ? route.params.bookId
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
  }, [languageId, language, reloadKey, route.params?.bookId, route.params?.chapter]);

  useEffect(() => {
    if (route.params?.bookId && books.some((item) => item.id === route.params.bookId)) {
      setBookId(route.params.bookId);
      setTestament(books.find((item) => item.id === route.params.bookId)?.testament || "OT");
      setChapter(Number(route.params.chapter) || 1);
      setPendingVerse(Number(route.params.verse) || null);
      setSelectedVerse(null);
    }
  }, [route.params?.bookId, route.params?.chapter, route.params?.verse, books]);

  useEffect(() => {
    if (!language || !bookId) return undefined;
    let active = true;
    setChapterListLoading(true);
    setChapterListVersion(null);
    setAvailableChapters([]);
    setChapterData(null);
    setError("");

    fetchLanguageBibleChapters(languageId, bookId)
      .then((records) => {
        if (!active) return;
        setChapterListVersion(chapterListKey);
        setAvailableChapters(records);
        if (records.length && !records.some((record) => record.chapter === activeChapter.current)) {
          setChapter(records[0].chapter);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load the chapter list.");
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

    fetchLanguageBibleChapter(languageId, bookId, chapter)
      .then((data) => {
        if (!active) return;
        setChapterData(data);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || "Could not load this chapter.");
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
    setPendingVerse(null);
    setSelectedVerse(null);
    setPicker(null);
  };

  const changeChapter = (direction) => {
    const candidates = availableChapters
      .map((item) => item.chapter)
      .filter((number) => direction < 0 ? number < chapter : number > chapter);
    if (!candidates.length) return;
    setChapter(direction < 0 ? Math.max(...candidates) : Math.min(...candidates));
    setPendingVerse(null);
    setSelectedVerse(null);
  };

  const retry = () => setReloadKey((key) => key + 1);
  const hasPrevious = availableChapters.some((item) => item.chapter < chapter);
  const hasNext = availableChapters.some((item) => item.chapter > chapter);

  useEffect(() => {
    if (!chapterData) return;
    trackLanguageReading(languageId, { bookId, chapter, verse: 1, bookName: book?.name });
  }, [chapterData, languageId, bookId, chapter, book?.name, trackLanguageReading]);

  useEffect(() => {
    if (
      !pendingVerse
      || chapterData?.bookId !== bookId
      || Number(chapterData?.chapter) !== Number(chapter)
    ) return;
    const verse = chapterData.verses.find((item) => item.number === pendingVerse);
    if (verse) setSelectedVerse(verse);
    else showToast(`Verse ${pendingVerse} is not in this chapter.`);
    setPendingVerse(null);
  }, [pendingVerse, chapterData, bookId, chapter]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const runSearch = async () => {
    if (searchLoading) return;
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError("Enter at least two characters to search.");
      return;
    }

    const referenceMatch = query.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
    if (referenceMatch) {
      const requestedBook = referenceMatch[1].trim().toLocaleLowerCase();
      const match = books.find((item) => (
        [item.name, item.commonName, item.englishName]
          .filter(Boolean)
          .some((name) => name.toLocaleLowerCase() === requestedBook)
      ));
      if (match) {
        const nextChapter = Number(referenceMatch[2]);
        const nextVerse = referenceMatch[3] ? Number(referenceMatch[3]) : null;
        if (nextChapter < 1 || nextChapter > match.chapters) {
          setSearchError(`Choose a chapter from 1 to ${match.chapters}.`);
          return;
        }
        setBookId(match.id);
        setTestament(match.testament);
        setChapter(nextChapter);
        setPendingVerse(nextVerse);
        setSelectedVerse(null);
        setSearchOpen(false);
        return;
      }
    }
    if (!referenceMatch) {
      const requestedBook = query.toLocaleLowerCase();
      const exactBook = books.find((item) => [item.name, item.commonName, item.englishName]
        .filter(Boolean)
        .some((name) => name.toLocaleLowerCase() === requestedBook));
      if (exactBook) {
        setBookId(exactBook.id);
        setTestament(exactBook.testament);
        setChapter(1);
        setPendingVerse(null);
        setSearchOpen(false);
        return;
      }
    }

    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    setSearchProgress(null);
    try {
      const results = await searchLanguageBible(languageId, query, (progress) => {
        setSearchProgress(progress);
      });
      setSearchResults(results);
      if (!results.length) setSearchError("No matching verses were found.");
    } catch (searchFailure) {
      setSearchError(searchFailure.message || "Search could not be completed. Please retry.");
    } finally {
      setSearchLoading(false);
    }
  };

  const matchingBooks = searchQuery.trim().length > 1
    ? books.filter((item) => [item.name, item.commonName, item.englishName]
      .filter(Boolean)
      .some((name) => name.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase())))
      .slice(0, 8)
    : [];

  const handleVerseAction = async (action) => {
    if (!selectedVerse || !book) return;
    const reference = `${book.name} ${chapter}:${selectedVerse.number}`;
    const shareText = `${selectedVerse.text} — ${reference} (${language.translationName})\n${language.attribution}\n${language.copyright}\nCC BY-SA 4.0: ${language.licenseUrl}\nSource: ${language.sourceUrl}`;
    try {
      if (action === "bookmark") {
        await toggleBookmark({
          languageId,
          bookId,
          chapter,
          verse: selectedVerse.number,
          reference,
          text: selectedVerse.text,
        });
        showToast(bookmarkedVerse ? "Bookmark removed" : "Verse saved");
      } else if (action === "highlight") {
        await highlightVerse(bookId, chapter, selectedVerse.number, "#FFE082", languageId);
        showToast("Verse highlighted");
      } else if (action === "copy") {
        await Clipboard.setStringAsync(shareText);
        showToast("Verse copied");
      } else if (action === "share") {
        await Share.share({ message: shareText });
      }
    } catch (actionError) {
      Alert.alert("Could not complete action", actionError.message || "Please try again.");
      return;
    }
    setSelectedVerse(null);
  };

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
          accessibilityLabel={`Search ${language.title} Bible`}
          onPress={() => {
            setSearchOpen(true);
            setSearchError("");
          }}
          style={styles.iconButton}
        >
          <Ionicons name="search" size={20} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh Bible content"
          onPress={retry}
          style={styles.iconButton}
        >
          <Ionicons name="refresh" size={19} color={theme.text} />
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
          accessibilityLabel={`Select chapter, current chapter ${chapter}`}
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

      <View style={styles.readerTools}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Decrease Bible text size"
          disabled={fontSize <= 14}
          onPress={() => updateSettings({ fontSize: Math.max(14, fontSize - 1) })}
          style={styles.fontControl}
        >
          <Text style={styles.fontControlText}>A−</Text>
        </TouchableOpacity>
        <Text style={styles.fontSizeLabel}>Text size</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Increase Bible text size"
          disabled={fontSize >= 28}
          onPress={() => updateSettings({ fontSize: Math.min(28, fontSize + 1) })}
          style={styles.fontControl}
        >
          <Text style={styles.fontControlText}>A+</Text>
        </TouchableOpacity>
        <View style={styles.toolSpacer} />
        <Text style={styles.chapterCount}>{books.length ? "66 books · 1,189 chapters" : ""}</Text>
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
            <Text style={styles.stateText}>Loading verses…</Text>
          </View>
        ) : isUnavailable || !availableChapters.length ? (
          <View style={styles.statePanel}>
            <Ionicons name="book-outline" size={30} color={theme.primary} />
            <Text style={styles.stateTitle}>
              {!availableChapters.length && book
                ? `No chapters are listed for ${book.name}.`
                : "This chapter is not available."}
            </Text>
            <Text style={styles.stateText}>
              Check your connection and try loading the book again.
            </Text>
          </View>
        ) : chapterData ? (
          <>
            <Text style={styles.chapterEyebrow}>{language.nativeTitle} · {book?.testament === "OT" ? "Old Testament" : "New Testament"}</Text>
            <Text style={styles.chapterHeading}>{book?.name || chapterData.bookName} {chapter}</Text>
            <View style={styles.verseList}>
              {chapterData.verses.map((verse) => (
                <Pressable
                  key={verse.number}
                  accessibilityRole="button"
                  accessibilityLabel={`${book?.name || chapterData.bookName} ${chapter}, verse ${verse.number}. Open verse actions.`}
                  onPress={() => setSelectedVerse(verse)}
                  style={[
                    styles.versePressable,
                    highlights[`${languageId}_${bookId}_${chapter}_${verse.number}`] && styles.highlightedVerse,
                  ]}
                >
                  <Text style={[styles.verseText, { fontSize, lineHeight: Math.round(fontSize * 1.72) }]}>
                    <Text style={styles.verseNumber}>{verse.number} </Text>
                    {verse.text}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.attribution}>
              <Text style={styles.attributionTitle}>{language.translationName}</Text>
              <Text style={styles.attributionText}>{language.attribution}</Text>
              <Text style={styles.attributionText}>{language.copyright}</Text>
              <TouchableOpacity
                accessibilityRole="link"
                onPress={() => Linking.openURL(language.sourceUrl).catch((linkError) => {
                  Alert.alert("Could not open source", linkError.message || "Please try again.");
                })}
                style={styles.licenseLink}
              >
                <Text style={styles.licenseLinkText}>Source · CC BY-SA 4.0 license</Text>
                <Ionicons name="open-outline" size={14} color={theme.primary} />
              </TouchableOpacity>
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
        <Text style={styles.footerMeta}>{availableChapters.length ? `${availableChapters.length} chapters` : ""}</Text>
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
                {picker === "book" ? "Choose a book" : `Chapters · ${book?.name || ""}`}
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
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.bookOption}
                      onPress={() => selectBook(item)}
                    >
                      <Text style={styles.optionText}>{item.name}</Text>
                      <Text style={styles.optionMeta}>
                        {`${item.chapters} chapters`}
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
                      accessibilityLabel={`Chapter ${item.chapter}`}
                      accessibilityState={{ selected: item.chapter === chapter }}
                      style={[
                        styles.chapterOption,
                        item.chapter === chapter && styles.activeChapterOption,
                      ]}
                      onPress={() => {
                        setChapter(item.chapter);
                        setPendingVerse(null);
                        setSelectedVerse(null);
                        setPicker(null);
                      }}
                    >
                      <Text style={styles.optionText}>{item.chapter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyPicker}>No chapters are available for this book.</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!selectedVerse}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVerse(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedVerse(null)}>
          <Pressable style={styles.verseActions} onPress={() => {}}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {selectedVerse ? `${book?.name || ""} ${chapter}:${selectedVerse.number}` : "Verse actions"}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close verse actions"
                onPress={() => setSelectedVerse(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={21} color={theme.text} />
              </TouchableOpacity>
            </View>
            {selectedVerse ? (
              <>
                <Text style={styles.selectedVerseText}>{selectedVerse.text}</Text>
                <View style={styles.verseActionGrid}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleVerseAction("bookmark")}
                    style={styles.verseAction}
                  >
                    <Ionicons name={bookmarkedVerse ? "bookmark" : "bookmark-outline"} size={20} color={theme.primary} />
                    <Text style={styles.verseActionText}>{bookmarkedVerse ? "Saved" : "Save"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleVerseAction("highlight")}
                    style={styles.verseAction}
                  >
                    <Ionicons name={highlightedVerse ? "color-fill" : "color-fill-outline"} size={20} color={theme.primary} />
                    <Text style={styles.verseActionText}>{highlightedVerse ? "Highlighted" : "Highlight"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleVerseAction("copy")}
                    style={styles.verseAction}
                  >
                    <Ionicons name="copy-outline" size={20} color={theme.primary} />
                    <Text style={styles.verseActionText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleVerseAction("share")}
                    style={styles.verseAction}
                  >
                    <Ionicons name="share-outline" size={20} color={theme.primary} />
                    <Text style={styles.verseActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={searchOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSearchOpen(false)}
      >
        <Pressable style={styles.searchBackdrop} onPress={() => setSearchOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.searchKeyboard}
          >
          <Pressable style={[styles.searchSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <View style={styles.pickerHeader}>
              <View style={styles.searchTitleWrap}>
                <Text style={styles.pickerTitle}>Search {language.title} Bible</Text>
                <Text style={styles.searchSubtitle}>Books, references, or verse text</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close Bible search"
                onPress={() => setSearchOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={21} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={18} color={theme.textMuted} />
              <TextInput
                accessibilityLabel="Search books, references, or Bible text"
                placeholder="Book, John 3:16, or a phrase"
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={(value) => {
                  setSearchQuery(value);
                  setSearchError("");
                  setSearchResults([]);
                }}
                onSubmitEditing={runSearch}
                returnKeyType="search"
                style={styles.searchInput}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchError("");
                    setSearchProgress(null);
                  }}
                  style={styles.clearSearch}
                >
                  <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={runSearch}
                disabled={searchLoading}
                style={styles.searchSubmit}
              >
                <Text style={styles.searchSubmitText}>Go</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.searchResults}>
              {searchLoading ? (
                <View style={styles.searchLoading}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={styles.stateText}>
                    {searchProgress === null
                      ? "Loading the complete Bible text for search. This may take a moment…"
                      : `Downloading Bible text… ${Math.round(searchProgress * 100)}%`}
                  </Text>
                </View>
              ) : (
                <>
                  {matchingBooks.length ? (
                    <>
                      <Text style={styles.searchSectionLabel}>Books</Text>
                      {matchingBooks.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.searchResult}
                          onPress={() => {
                            setBookId(item.id);
                            setTestament(item.testament);
                            setChapter(1);
                            setPendingVerse(null);
                            setSearchOpen(false);
                          }}
                        >
                          <Text style={styles.searchResultTitle}>{item.name}</Text>
                          <Text style={styles.searchResultMeta}>{item.chapters} chapters</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : null}
                  {searchResults.length ? (
                    <>
                      <Text style={styles.searchSectionLabel}>Matching verses</Text>
                      {searchResults.map((item) => (
                        <TouchableOpacity
                          key={`${item.bookId}-${item.chapter}-${item.verse}`}
                          style={styles.searchResult}
                          onPress={() => {
                            setBookId(item.bookId);
                            setTestament(books.find((entry) => entry.id === item.bookId)?.testament || "OT");
                            setChapter(Number(item.chapter));
                            setPendingVerse(Number(item.verse));
                            setSearchOpen(false);
                          }}
                        >
                          <Text style={styles.searchResultTitle}>{item.reference}</Text>
                          <Text style={styles.searchResultBody}>{item.text}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : null}
                  {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
                  {!searchQuery.trim() ? (
                    <Text style={styles.searchHint}>
                      The first full-text search downloads about 13 MB of {language.translationName} and saves it for future offline searches.
                    </Text>
                  ) : null}
                </>
              )}
            </ScrollView>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {toast ? (
        <View accessibilityLiveRegion="polite" style={[styles.toast, { bottom: Math.max(insets.bottom, 16) + 72 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
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
    readerTools: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      gap: 8,
      marginBottom: 4,
    },
    fontControl: {
      minWidth: 34,
      minHeight: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    fontControlText: { color: theme.text, fontSize: 13, fontWeight: "700" },
    fontSizeLabel: { color: theme.textMuted, fontSize: 11 },
    toolSpacer: { flex: 1 },
    chapterCount: { color: theme.textMuted, fontSize: 10 },
    reader: { flex: 1 },
    content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 },
    chapterEyebrow: { color: theme.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
    chapterHeading: { color: theme.text, fontSize: 24, fontWeight: "800", marginTop: 5, marginBottom: 22 },
    verseList: { gap: 8 },
    versePressable: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 4 },
    highlightedVerse: { backgroundColor: theme.isDark ? "rgba(255,224,130,0.16)" : "rgba(255,224,130,0.28)" },
    verseText: { color: theme.text, fontSize: 19, lineHeight: 34, fontWeight: "400" },
    verseNumber: { color: theme.primary, fontSize: 13, fontWeight: "800" },
    attribution: {
      marginTop: 28,
      padding: 14,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    attributionTitle: { color: theme.text, fontSize: 12, fontWeight: "800" },
    attributionText: { color: theme.textMuted, fontSize: 10, lineHeight: 15, marginTop: 5 },
    licenseLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 9, minHeight: 30 },
    licenseLinkText: { color: theme.primary, fontSize: 11, fontWeight: "700" },
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
    verseActions: { overflow: "hidden", borderRadius: 18, backgroundColor: theme.surface },
    selectedVerseText: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, color: theme.text, fontSize: 16, lineHeight: 25 },
    verseActionGrid: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.border },
    verseAction: { minWidth: 66, minHeight: 62, alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12 },
    verseActionText: { color: theme.text, fontSize: 11, fontWeight: "700" },
    searchBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.48)" },
    searchKeyboard: { flex: 1, justifyContent: "flex-end" },
    searchSheet: { maxHeight: "88%", borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: theme.surface, overflow: "hidden" },
    searchTitleWrap: { flex: 1 },
    searchSubtitle: { color: theme.textMuted, fontSize: 11, marginTop: 3 },
    searchInputRow: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginTop: 14,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 13,
      backgroundColor: theme.bg,
    },
    searchInput: { flex: 1, minWidth: 0, color: theme.text, fontSize: 14, paddingVertical: 10 },
    clearSearch: { width: 30, height: 40, alignItems: "center", justifyContent: "center" },
    searchSubmit: { minWidth: 44, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: theme.primary },
    searchSubmitText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
    searchResults: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
    searchLoading: { alignItems: "center", gap: 10, paddingVertical: 24 },
    searchSectionLabel: { color: theme.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 8, marginBottom: 5 },
    searchResult: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    searchResultTitle: { color: theme.primary, fontSize: 13, fontWeight: "800" },
    searchResultBody: { color: theme.text, fontSize: 13, lineHeight: 19, marginTop: 4 },
    searchResultMeta: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
    searchError: { color: theme.primary, fontSize: 12, lineHeight: 18, paddingVertical: 12 },
    searchHint: { color: theme.textMuted, fontSize: 12, lineHeight: 19, paddingVertical: 14 },
    toast: {
      position: "absolute",
      alignSelf: "center",
      backgroundColor: theme.isDark ? "#F1E7DA" : "#29231F",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    toastText: { color: theme.isDark ? "#29231F" : "#FFFFFF", fontSize: 12, fontWeight: "700" },
  });
}
