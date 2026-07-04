/** World English Bible (WEB) — public domain */

export const BIBLE_TRANSLATION = 'web';
export const BIBLE_API = 'https://bible-api.com';

export const READING_THEMES = {
  light: {
    id: 'light',
    label: 'Light',
    bg: '#FDFBF0',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    muted: '#6B7280',
    accent: '#C96A1B',
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    bg: '#121212',
    surface: '#1A1A1A',
    text: '#F5F5F5',
    muted: '#9CA3AF',
    accent: '#E18A3A',
  },
  sepia: {
    id: 'sepia',
    label: 'Sepia',
    bg: '#F4ECD8',
    surface: '#FBF6EA',
    text: '#3E2F1C',
    muted: '#7A6548',
    accent: '#8B6914',
  },
  amoled: {
    id: 'amoled',
    label: 'AMOLED',
    bg: '#000000',
    surface: '#0A0A0A',
    text: '#E8E8E8',
    muted: '#888888',
    accent: '#FF6B00',
  },
};

export const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28];
export const FONT_FAMILIES = [
  { id: 'system', label: 'System' },
  { id: 'serif', label: 'Serif' },
  { id: 'rounded', label: 'Rounded' },
];

export const AUDIO_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
export const SLEEP_TIMERS = [5, 10, 15, 30];

export const READING_PLANS = [
  {
    id: '30_faith',
    title: '30 Day Faith Journey',
    subtitle: 'Foundations of Christian living',
    days: 30,
    color: '#C96A1B',
  },
  {
    id: '90_bible',
    title: '90 Day Bible Overview',
    subtitle: 'Key stories from Genesis to Revelation',
    days: 90,
    color: '#F3703E',
  },
  {
    id: '365_bible',
    title: '365 Day Bible',
    subtitle: 'Read through Scripture in one year',
    days: 365,
    color: '#6B8F71',
  },
];

// NOTE: Book IDs used in DAILY_VERSES must match the 'id' field in BIBLE_BOOKS below.
// john='jo', jonah='jon', philippians='php', psalms='ps', romans='rm', proverbs='prv',
// isaiah='is', jeremiah='jr', matthew='mt'
export const DAILY_VERSES = [
  {
    reference: 'John 3:16',
    text: 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.',
    bookId: 'jo',
    chapter: 3,
    verse: 16,
  },
  {
    reference: 'Psalm 23:1',
    text: 'The LORD is my shepherd; I shall lack nothing.',
    bookId: 'ps',
    chapter: 23,
    verse: 1,
  },
  {
    reference: 'Philippians 4:13',
    text: 'I can do all things through Christ who strengthens me.',
    bookId: 'php',
    chapter: 4,
    verse: 13,
  },
  {
    reference: 'Jeremiah 29:11',
    text: "For I know the thoughts that I think toward you, says the LORD, thoughts of peace, and not of evil, to give you hope and a future.",
    bookId: 'jr',
    chapter: 29,
    verse: 11,
  },
  {
    reference: 'Romans 8:28',
    text: 'We know that all things work together for good for those who love God, for those who are called according to his purpose.',
    bookId: 'rm',
    chapter: 8,
    verse: 28,
  },
  {
    reference: 'Proverbs 3:5',
    text: "Trust in the LORD with all your heart, and don't lean on your own understanding.",
    bookId: 'prv',
    chapter: 3,
    verse: 5,
  },
  {
    reference: 'Isaiah 41:10',
    text: "Don't you be afraid, for I am with you. Don't be dismayed, for I am your God.",
    bookId: 'is',
    chapter: 41,
    verse: 10,
  },
  {
    reference: 'Matthew 11:28',
    text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.',
    bookId: 'mt',
    chapter: 11,
    verse: 28,
  },
];

export const DAILY_DEVOTIONALS = [
  {
    id: 'd1',
    theme: 'Walking in Faith',
    duration: '4 min',
    author: 'Faith Frames',
    excerpt: 'Trust God one step at a time, even when the path is unclear.',
  },
  {
    id: 'd2',
    theme: 'Grace for Today',
    duration: '3 min',
    author: 'Faith Frames',
    excerpt: 'His mercies are new every morning — receive them with an open heart.',
  },
  {
    id: 'd3',
    theme: 'Prayer & Peace',
    duration: '5 min',
    author: 'Faith Frames',
    excerpt: 'Bring every worry to the throne of grace and rest in His presence.',
  },
];

// ─── All 66 canonical Bible books ────────────────────────────────────────────
// Each 'id' must be stable — used as cache keys and navigation params.
// Each 'slug' must exactly match what bible-api.com expects.
export const BIBLE_BOOKS = [
  // ── OLD TESTAMENT ──────────────────────────────────────────────────────────
  // Law (Pentateuch)
  { id: 'gn',   name: 'Genesis',        slug: 'genesis',        testament: 'OT', chapters: 50,  group: 'Law'      },
  { id: 'ex',   name: 'Exodus',         slug: 'exodus',         testament: 'OT', chapters: 40,  group: 'Law'      },
  { id: 'lv',   name: 'Leviticus',      slug: 'leviticus',      testament: 'OT', chapters: 27,  group: 'Law'      },
  { id: 'nm',   name: 'Numbers',        slug: 'numbers',        testament: 'OT', chapters: 36,  group: 'Law'      },
  { id: 'dt',   name: 'Deuteronomy',    slug: 'deuteronomy',    testament: 'OT', chapters: 34,  group: 'Law'      },
  // History
  { id: 'js',   name: 'Joshua',         slug: 'joshua',         testament: 'OT', chapters: 24,  group: 'History'  },
  { id: 'jud',  name: 'Judges',         slug: 'judges',         testament: 'OT', chapters: 21,  group: 'History'  },
  { id: 'rt',   name: 'Ruth',           slug: 'ruth',           testament: 'OT', chapters: 4,   group: 'History'  },
  { id: '1sm',  name: '1 Samuel',       slug: '1 samuel',       testament: 'OT', chapters: 31,  group: 'History'  },
  { id: '2sm',  name: '2 Samuel',       slug: '2 samuel',       testament: 'OT', chapters: 24,  group: 'History'  },
  { id: '1kgs', name: '1 Kings',        slug: '1 kings',        testament: 'OT', chapters: 22,  group: 'History'  },
  { id: '2kgs', name: '2 Kings',        slug: '2 kings',        testament: 'OT', chapters: 25,  group: 'History'  },
  { id: '1ch',  name: '1 Chronicles',   slug: '1 chronicles',   testament: 'OT', chapters: 29,  group: 'History'  },
  { id: '2ch',  name: '2 Chronicles',   slug: '2 chronicles',   testament: 'OT', chapters: 36,  group: 'History'  },
  { id: 'ezr',  name: 'Ezra',           slug: 'ezra',           testament: 'OT', chapters: 10,  group: 'History'  },
  { id: 'ne',   name: 'Nehemiah',       slug: 'nehemiah',       testament: 'OT', chapters: 13,  group: 'History'  },
  { id: 'et',   name: 'Esther',         slug: 'esther',         testament: 'OT', chapters: 10,  group: 'History'  },
  // Poetry
  { id: 'job',  name: 'Job',            slug: 'job',            testament: 'OT', chapters: 42,  group: 'Poetry'   },
  { id: 'ps',   name: 'Psalms',         slug: 'psalms',         testament: 'OT', chapters: 150, group: 'Poetry'   },
  { id: 'prv',  name: 'Proverbs',       slug: 'proverbs',       testament: 'OT', chapters: 31,  group: 'Poetry'   },
  { id: 'ec',   name: 'Ecclesiastes',   slug: 'ecclesiastes',   testament: 'OT', chapters: 12,  group: 'Poetry'   },
  { id: 'so',   name: 'Song of Solomon',slug: 'song of solomon',testament: 'OT', chapters: 8,   group: 'Poetry'   },
  // Major Prophets
  { id: 'is',   name: 'Isaiah',         slug: 'isaiah',         testament: 'OT', chapters: 66,  group: 'Prophets' },
  { id: 'jr',   name: 'Jeremiah',       slug: 'jeremiah',       testament: 'OT', chapters: 52,  group: 'Prophets' },
  { id: 'lm',   name: 'Lamentations',   slug: 'lamentations',   testament: 'OT', chapters: 5,   group: 'Prophets' },
  { id: 'ez',   name: 'Ezekiel',        slug: 'ezekiel',        testament: 'OT', chapters: 48,  group: 'Prophets' },
  { id: 'dn',   name: 'Daniel',         slug: 'daniel',         testament: 'OT', chapters: 12,  group: 'Prophets' },
  // Minor Prophets
  { id: 'ho',   name: 'Hosea',          slug: 'hosea',          testament: 'OT', chapters: 14,  group: 'Prophets' },
  { id: 'jl',   name: 'Joel',           slug: 'joel',           testament: 'OT', chapters: 3,   group: 'Prophets' },
  { id: 'am',   name: 'Amos',           slug: 'amos',           testament: 'OT', chapters: 9,   group: 'Prophets' },
  { id: 'ob',   name: 'Obadiah',        slug: 'obadiah',        testament: 'OT', chapters: 1,   group: 'Prophets' },
  { id: 'jon',  name: 'Jonah',          slug: 'jonah',          testament: 'OT', chapters: 4,   group: 'Prophets' },
  { id: 'mi',   name: 'Micah',          slug: 'micah',          testament: 'OT', chapters: 7,   group: 'Prophets' },
  { id: 'na',   name: 'Nahum',          slug: 'nahum',          testament: 'OT', chapters: 3,   group: 'Prophets' },
  { id: 'hk',   name: 'Habakkuk',       slug: 'habakkuk',       testament: 'OT', chapters: 3,   group: 'Prophets' },
  { id: 'zp',   name: 'Zephaniah',      slug: 'zephaniah',      testament: 'OT', chapters: 3,   group: 'Prophets' },
  { id: 'hg',   name: 'Haggai',         slug: 'haggai',         testament: 'OT', chapters: 2,   group: 'Prophets' },
  { id: 'zc',   name: 'Zechariah',      slug: 'zechariah',      testament: 'OT', chapters: 14,  group: 'Prophets' },
  { id: 'ml',   name: 'Malachi',        slug: 'malachi',        testament: 'OT', chapters: 4,   group: 'Prophets' },
  // ── NEW TESTAMENT ──────────────────────────────────────────────────────────
  // Gospels
  { id: 'mt',   name: 'Matthew',        slug: 'matthew',        testament: 'NT', chapters: 28,  group: 'Gospels'  },
  { id: 'mk',   name: 'Mark',           slug: 'mark',           testament: 'NT', chapters: 16,  group: 'Gospels'  },
  { id: 'lk',   name: 'Luke',           slug: 'luke',           testament: 'NT', chapters: 24,  group: 'Gospels'  },
  { id: 'jo',   name: 'John',           slug: 'john',           testament: 'NT', chapters: 21,  group: 'Gospels'  },
  // History
  { id: 'act',  name: 'Acts',           slug: 'acts',           testament: 'NT', chapters: 28,  group: 'History'  },
  // Letters (Pauline)
  { id: 'rm',   name: 'Romans',         slug: 'romans',         testament: 'NT', chapters: 16,  group: 'Letters'  },
  { id: '1co',  name: '1 Corinthians',  slug: '1 corinthians',  testament: 'NT', chapters: 16,  group: 'Letters'  },
  { id: '2co',  name: '2 Corinthians',  slug: '2 corinthians',  testament: 'NT', chapters: 13,  group: 'Letters'  },
  { id: 'gl',   name: 'Galatians',      slug: 'galatians',      testament: 'NT', chapters: 6,   group: 'Letters'  },
  { id: 'eph',  name: 'Ephesians',      slug: 'ephesians',      testament: 'NT', chapters: 6,   group: 'Letters'  },
  { id: 'php',  name: 'Philippians',    slug: 'philippians',    testament: 'NT', chapters: 4,   group: 'Letters'  },
  { id: 'cl',   name: 'Colossians',     slug: 'colossians',     testament: 'NT', chapters: 4,   group: 'Letters'  },
  { id: '1ts',  name: '1 Thessalonians',slug: '1 thessalonians',testament: 'NT', chapters: 5,   group: 'Letters'  },
  { id: '2ts',  name: '2 Thessalonians',slug: '2 thessalonians',testament: 'NT', chapters: 3,   group: 'Letters'  },
  { id: '1tm',  name: '1 Timothy',      slug: '1 timothy',      testament: 'NT', chapters: 6,   group: 'Letters'  },
  { id: '2tm',  name: '2 Timothy',      slug: '2 timothy',      testament: 'NT', chapters: 4,   group: 'Letters'  },
  { id: 'tt',   name: 'Titus',          slug: 'titus',          testament: 'NT', chapters: 3,   group: 'Letters'  },
  { id: 'phm',  name: 'Philemon',       slug: 'philemon',       testament: 'NT', chapters: 1,   group: 'Letters'  },
  // General Letters
  { id: 'hb',   name: 'Hebrews',        slug: 'hebrews',        testament: 'NT', chapters: 13,  group: 'Letters'  },
  { id: 'jm',   name: 'James',          slug: 'james',          testament: 'NT', chapters: 5,   group: 'Letters'  },
  { id: '1pe',  name: '1 Peter',        slug: '1 peter',        testament: 'NT', chapters: 5,   group: 'Letters'  },
  { id: '2pe',  name: '2 Peter',        slug: '2 peter',        testament: 'NT', chapters: 3,   group: 'Letters'  },
  { id: '1jo',  name: '1 John',         slug: '1 john',         testament: 'NT', chapters: 5,   group: 'Letters'  },
  { id: '2jo',  name: '2 John',         slug: '2 john',         testament: 'NT', chapters: 1,   group: 'Letters'  },
  { id: '3jo',  name: '3 John',         slug: '3 john',         testament: 'NT', chapters: 1,   group: 'Letters'  },
  { id: 'jd',   name: 'Jude',           slug: 'jude',           testament: 'NT', chapters: 1,   group: 'Letters'  },
  // Prophecy
  { id: 're',   name: 'Revelation',     slug: 'revelation',     testament: 'NT', chapters: 22,  group: 'Prophecy' },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────
export const getBookById = (id) => BIBLE_BOOKS.find((b) => b.id === id) || null;
export const getBooksByTestament = (testament) =>
  BIBLE_BOOKS.filter((b) => b.testament === testament);

// ─── Daily helpers ────────────────────────────────────────────────────────────
export const getDailyVerse = (date = new Date()) => {
  const dayIndex = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(2024, 0, 1)) /
      86400000,
  );
  const idx =
    ((dayIndex % DAILY_VERSES.length) + DAILY_VERSES.length) %
    DAILY_VERSES.length;
  return DAILY_VERSES[idx];
};

export const getDailyDevotional = (date = new Date()) => {
  const idx = date.getDate() % DAILY_DEVOTIONALS.length;
  return DAILY_DEVOTIONALS[idx];
};

export const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
