import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { BIBLE_BOOKS } from "../constants/bible";

const LANGUAGES = new Set(["hindi", "telugu"]);
const chapterId = (language, bookId, chapter) => `${language}_${bookId}_${chapter}`;

function assertLanguage(language) {
  if (!LANGUAGES.has(language)) throw new Error("Choose Hindi or Telugu.");
}

export async function fetchLanguageBibleBooks(language) {
  assertLanguage(language);
  const snapshot = await getDocsFromServer(query(collection(db, "bibleBooks"), orderBy("order", "asc")));
  if (snapshot.empty) {
    throw new Error("The Bible catalog is not available yet. Please try again later.");
  }

  const fallbackBooks = new Map(BIBLE_BOOKS.map((book) => [book.id, book]));
  return snapshot.docs.map((item) => {
    const saved = item.data();
    const fallback = fallbackBooks.get(item.id);
    const displayName = saved[`${language}Name`];
    const chapterCount = Number(
      saved[`${language}ChapterCount`] || saved.chapterCount || fallback?.chapters
    );
    return {
      id: item.id,
      name: typeof displayName === "string" && displayName.trim()
        ? displayName.trim()
        : saved.englishName || fallback?.name || item.id,
      englishName: saved.englishName || fallback?.name || item.id,
      testament: saved.testament || fallback?.testament || "OT",
      chapters: Number.isInteger(chapterCount) && chapterCount > 0 ? chapterCount : 1,
      order: Number(saved.order) || fallback?.order || 0,
    };
  }).sort((a, b) => a.order - b.order);
}

export async function fetchPublishedLanguageChapters(language, bookId) {
  assertLanguage(language);
  const snapshot = await getDocsFromServer(query(
    collection(db, "bibleChapters"),
    where("language", "==", language),
    where("bookId", "==", bookId),
    where("status", "==", "published"),
    orderBy("chapter", "asc")
  ));

  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      chapter: data.chapter,
      verseCount: data.verseCount,
      publishedAt: data.publishedAt,
    };
  });
}

export async function fetchPublishedLanguageChapter(language, bookId, chapter) {
  assertLanguage(language);
  const snapshot = await getDocFromServer(doc(
    db,
    "bibleChapters",
    chapterId(language, bookId, chapter)
  ));
  if (!snapshot.exists() || snapshot.get("status") !== "published") {
    const unavailable = new Error("This chapter is not available yet.");
    unavailable.code = "chapter/not-published";
    throw unavailable;
  }

  const data = snapshot.data();
  if (
    data.language !== language
    || data.bookId !== bookId
    || data.chapter !== chapter
    || !Array.isArray(data.verses)
  ) {
    throw new Error("The published chapter data is incomplete. Please contact support.");
  }

  const verses = data.verses
    .filter((verse) => Number.isInteger(verse.number) && verse.number > 0 && typeof verse.text === "string" && verse.text.trim())
    .sort((a, b) => a.number - b.number);
  if (!verses.length) {
    throw new Error("This published chapter has no readable verses. Please contact support.");
  }

  return {
    language,
    bookId,
    chapter,
    bookName: data.bookName,
    verses,
  };
}
