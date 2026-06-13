import {
  BIBLE_API,
  BIBLE_TRANSLATION,
  BIBLE_BOOKS,
  getBookById,
} from '../constants/bible';
import { getCachedChapter, cacheChapter } from '../storage/bibleStorage';

const chapterCacheKey = (slug, chapter) => `${slug}_${chapter}`;

export async function fetchChapter(bookId, chapter) {
  const book = getBookById(bookId);
  if (!book) throw new Error('Unknown Bible book');

  const cacheKey = chapterCacheKey(book.slug, chapter);
  const cached = await getCachedChapter(cacheKey);
  if (cached) return { ...cached, book, fromCache: true };

  const url = `${BIBLE_API}/${encodeURIComponent(book.slug)}+${chapter}?translation=${BIBLE_TRANSLATION}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${book.name} ${chapter}. Check your connection.`);
  }

  const data = await response.json();
  const normalized = {
    bookId: book.id,
    bookName: book.name,
    chapter,
    reference: data.reference || `${book.name} ${chapter}`,
    verses: (data.verses || []).map((v) => ({
      number: v.verse,
      text: String(v.text || '').trim(),
    })),
  };

  await cacheChapter(cacheKey, normalized);
  return { ...normalized, book, fromCache: false };
}

export async function fetchVerseReference(reference) {
  const url = `${BIBLE_API}/${encodeURIComponent(reference)}?translation=${BIBLE_TRANSLATION}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Verse not found');
  const data = await response.json();
  return {
    reference: data.reference,
    text: data.text?.trim() || '',
    verses: data.verses || [],
  };
}

export function searchBooks(query) {
  const q = query.trim().toLowerCase();
  if (!q) return BIBLE_BOOKS;
  return BIBLE_BOOKS.filter(
    (book) =>
      book.name.toLowerCase().includes(q) ||
      book.slug.includes(q) ||
      book.group.toLowerCase().includes(q)
  );
}

export async function searchBible(query) {
  const q = query.trim();
  if (!q) return { books: [], verse: null };

  const books = searchBooks(q);

  if (/^\d?\s*[a-zA-Z]+\s+\d+:\d+/i.test(q) || /^[a-zA-Z]+\s+\d+:\d+/i.test(q)) {
    try {
      const verse = await fetchVerseReference(q);
      return { books, verse };
    } catch {
      return { books, verse: null };
    }
  }

  if (/^\d?\s*[a-zA-Z]+\s+\d+$/i.test(q)) {
    const match = q.match(/^(\d?\s*[a-zA-Z\s]+)\s+(\d+)$/i);
    if (match) {
      const bookQuery = match[1].trim().toLowerCase();
      const chapter = Number(match[2]);
      const book = BIBLE_BOOKS.find(
        (b) => b.name.toLowerCase() === bookQuery || b.slug === bookQuery
      );
      if (book) return { books: [book], chapter, verse: null };
    }
  }

  return { books, verse: null };
}
