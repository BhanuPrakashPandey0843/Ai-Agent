import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { getJSON, storeJSON } from "../storage";
import { cacheChapter, getCachedChapter } from "../storage/bibleStorage";
import { BIBLE_BOOKS } from "../constants/bible";
import { getLanguageBible } from "../data/languageBibles";

const API_ROOT = "https://bible.helloao.org/api";
const REQUEST_TIMEOUT_MS = 25000;
const SEARCH_TIMEOUT_MS = 120000;
const BOOK_CACHE_KEY = "faithframes_language_bible_books_v1";
const EXPECTED_BOOK_COUNT = 66;
const EXPECTED_CHAPTER_COUNT = 1189;
const chapterRequests = new Map();
const searchIndexRequests = new Map();
let activeSearchIndex = null;

function getLanguage(languageId) {
  const language = getLanguageBible(languageId);
  if (!language) throw new Error("Choose Hindi or Telugu.");
  return language;
}

async function requestJson(url, label, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), timeoutMs);
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) {
      throw new Error(`${label} could not be loaded (HTTP ${response.status}). Please retry.`);
    }
    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Loading ${label} timed out. Check your connection and retry.`);
    }
    if (error instanceof TypeError) {
      throw new Error(`Could not connect to load ${label}. Check your internet connection and retry.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function chapterCacheKey(languageId, bookId, chapter) {
  return `helloao_${languageId}_${bookId}_${chapter}`;
}

export async function fetchLanguageBibleBooks(languageId) {
  const language = getLanguage(languageId);
  const cachedCatalog = (await getJSON(BOOK_CACHE_KEY)) || {};
  const cached = cachedCatalog[languageId];
  if (Array.isArray(cached?.books) && cached.books.length === 66) return cached.books;

  const response = await requestJson(
    `${API_ROOT}/${encodeURIComponent(language.translationId)}/books.json`,
    `${language.title} Bible book list`
  );
  if (
    response?.translation?.id !== language.translationId
    || !Array.isArray(response.books)
    || response.books.length !== EXPECTED_BOOK_COUNT
  ) {
    throw new Error(`The ${language.title} Bible catalog is incomplete. Please retry later.`);
  }

  const books = response.books.map((book, index) => {
    const chapters = Number(book.numberOfChapters);
    if (!book?.id || !book.name || !Number.isInteger(chapters) || chapters < 1) {
      throw new Error(`The ${language.title} Bible catalog contains an invalid book entry.`);
    }
    return {
      id: book.id,
      name: book.name,
      commonName: book.commonName || book.name,
      englishName: BIBLE_BOOKS[index]?.name || book.englishName || "",
      testament: index < 39 ? "OT" : "NT",
      chapters,
      order: Number(book.order) || index + 1,
    };
  });
  if (books.reduce((count, item) => count + item.chapters, 0) !== EXPECTED_CHAPTER_COUNT) {
    throw new Error(`The ${language.title} Bible catalog does not contain all chapters.`);
  }
  await storeJSON(BOOK_CACHE_KEY, {
    ...cachedCatalog,
    [languageId]: { books, cachedAt: Date.now() },
  });
  return books;
}

export async function fetchLanguageBibleChapters(languageId, bookId) {
  const books = await fetchLanguageBibleBooks(languageId);
  const book = books.find((item) => item.id === bookId);
  if (!book) throw new Error("This book is not available in the selected translation.");
  return Array.from({ length: book.chapters }, (_, index) => ({
    chapter: index + 1,
    verseCount: null,
  }));
}

export async function fetchLanguageBibleChapter(languageId, bookId, chapter) {
  const language = getLanguage(languageId);
  const chapterNumber = Number(chapter);
  if (!bookId || !Number.isInteger(chapterNumber) || chapterNumber < 1) {
    throw new Error("Choose a valid Bible chapter.");
  }

  const key = chapterCacheKey(languageId, bookId, chapterNumber);
  const cached = await getCachedChapter(key);
  if (cached) return { ...cached, fromCache: true };
  if (chapterRequests.has(key)) return chapterRequests.get(key);

  const request = (async () => {
    const response = await requestJson(
      `${API_ROOT}/${encodeURIComponent(language.translationId)}/${encodeURIComponent(bookId)}/${chapterNumber}.simple.json`,
      `${language.title} Bible chapter`
    );
    if (
      response?.translation?.id !== language.translationId
      || response?.book?.id !== bookId
      || Number(response?.chapter?.number) !== chapterNumber
      || !Array.isArray(response?.chapter?.content)
    ) {
      throw new Error("The Bible chapter response was incomplete. Please retry.");
    }
    const verses = response.chapter.content
      .filter((item) => item?.type === "verse")
      .map((item) => ({ number: Number(item.number), text: String(item.text || "").trim() }))
      .filter((verse) => Number.isInteger(verse.number) && verse.number > 0 && verse.text);
    if (!verses.length) throw new Error("This chapter has no readable verses.");

    const data = {
      language: languageId,
      bookId,
      bookName: response.book.name,
      chapter: chapterNumber,
      verses,
    };
    await cacheChapter(key, data);
    return { ...data, fromCache: false };
  })();
  chapterRequests.set(key, request);
  try {
    return await request;
  } finally {
    chapterRequests.delete(key);
  }
}

function validateSearchIndex(data, language) {
  const chapters = Array.isArray(data?.books)
    ? data.books.flatMap((book) => Array.isArray(book.chapters) ? book.chapters : [])
    : [];
  if (
    data?.translation?.id !== language.translationId
    || !Array.isArray(data.books)
    || data.books.length !== EXPECTED_BOOK_COUNT
    || chapters.length !== EXPECTED_CHAPTER_COUNT
    || chapters.some((item) => !Array.isArray(item?.chapter?.content))
  ) {
    throw new Error(`The full-text ${language.title} search index is incomplete.`);
  }
  return data;
}

async function readSearchIndexFile(path, language) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists || !info.size) return null;
  const contents = await FileSystem.readAsStringAsync(path);
  return validateSearchIndex(JSON.parse(contents), language);
}

function openWebSearchDatabase() {
  if (typeof indexedDB === "undefined") {
    throw new Error("This browser does not support persistent Bible search storage.");
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FaithFramesBibleSearch", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("translations")) {
        request.result.createObjectStore("translations");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Could not open local Bible search storage."));
  });
}

async function getWebSearchIndex(language) {
  const database = await openWebSearchDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("translations", "readonly");
    const request = transaction.objectStore("translations").get(language.translationId);
    request.onsuccess = () => {
      try {
        resolve(request.result ? validateSearchIndex(request.result, language) : null);
      } catch (error) {
        console.warn("[LanguageBible] cached browser search index is invalid:", error?.message);
        resolve(null);
      } finally {
        database.close();
      }
    };
    request.onerror = () => {
      database.close();
      reject(new Error("Could not read the cached Bible search index."));
    };
  });
}

async function saveWebSearchIndex(language, data) {
  const database = await openWebSearchDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("translations", "readwrite");
    transaction.objectStore("translations").put(data, language.translationId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(new Error("Could not cache the Bible search index in this browser."));
    };
    transaction.onabort = () => {
      database.close();
      reject(new Error("The browser could not store the Bible search index."));
    };
  });
}

async function fetchCompleteSearchIndex(language, onProgress) {
  const documentDirectory = FileSystem.documentDirectory;
  if (Platform.OS !== "web" && documentDirectory) {
    const directory = `${documentDirectory}bible-search/`;
    const path = `${directory}${language.translationId}.json`;
    const directoryInfo = await FileSystem.getInfoAsync(directory);
    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    try {
      const cached = await readSearchIndexFile(path, language);
      if (cached) return cached;
    } catch (error) {
      console.warn("[LanguageBible] cached search index is invalid; downloading a fresh copy:", error?.message);
      await FileSystem.deleteAsync(path, { idempotent: true });
    }

    const temporaryPath = `${path}.${Date.now()}.tmp`;
    const download = FileSystem.createDownloadResumable(
      `${API_ROOT}/${encodeURIComponent(language.translationId)}/complete.simple.json`,
      temporaryPath,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0) {
          onProgress?.(totalBytesWritten / totalBytesExpectedToWrite);
        }
      }
    );
    try {
      const result = await download.downloadAsync();
      if (!result || result.status < 200 || result.status >= 300) {
        throw new Error(`Full-text ${language.title} search could not be downloaded. Please retry.`);
      }
      const data = await readSearchIndexFile(temporaryPath, language);
      if (!data) throw new Error(`Full-text ${language.title} search download was empty.`);
      await FileSystem.moveAsync({ from: temporaryPath, to: path });
      onProgress?.(1);
      return data;
    } catch (error) {
      await FileSystem.deleteAsync(temporaryPath, { idempotent: true });
      throw error;
    }
  }

  if (Platform.OS === "web") {
    const cached = await getWebSearchIndex(language);
    if (cached) return cached;
    const data = validateSearchIndex(
      await requestJson(
        `${API_ROOT}/${encodeURIComponent(language.translationId)}/complete.simple.json`,
        `full-text ${language.title} search index`,
        SEARCH_TIMEOUT_MS
      ),
      language
    );
    await saveWebSearchIndex(language, data);
    onProgress?.(1);
    return data;
  }

  const response = await requestJson(
    `${API_ROOT}/${encodeURIComponent(language.translationId)}/complete.simple.json`,
    `full-text ${language.title} search index`,
    SEARCH_TIMEOUT_MS
  );
  onProgress?.(1);
  return validateSearchIndex(response, language);
}

async function getCompleteSearchIndex(language, onProgress) {
  if (activeSearchIndex?.languageId === language.id) return activeSearchIndex.data;
  if (searchIndexRequests.has(language.id)) return searchIndexRequests.get(language.id);

  const request = fetchCompleteSearchIndex(language, onProgress).then((data) => {
    activeSearchIndex = { languageId: language.id, data };
    return data;
  }).finally(() => {
    searchIndexRequests.delete(language.id);
  });
  searchIndexRequests.set(language.id, request);
  return request;
}

export async function searchLanguageBible(languageId, query, onProgress) {
  const language = getLanguage(languageId);
  const term = String(query || "").trim().normalize("NFC").toLocaleLowerCase();
  if (term.length < 2) return [];
  const index = await getCompleteSearchIndex(language, onProgress);
  const results = [];

  for (const book of index.books) {
    for (const chapter of book.chapters || []) {
      for (const item of chapter.chapter?.content || []) {
        if (item.type !== "verse") continue;
        const text = String(item.text || "").normalize("NFC").toLocaleLowerCase();
        if (!text.includes(term)) continue;
        results.push({
          bookId: book.id,
          bookName: book.name,
          chapter: chapter.chapter.number,
          verse: item.number,
          text: item.text,
          reference: `${book.name} ${chapter.chapter.number}:${item.number}`,
        });
        if (results.length >= 100) return results;
      }
    }
  }
  return results;
}
