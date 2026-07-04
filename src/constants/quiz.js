/**
 * Quiz module configuration — maps mobile quiz types to admin `questions` categories.
 * Admin categories: bible | jesus | old | new | mixed
 */

export const QUIZ_COLLECTIONS = {
  QUESTIONS: 'questions',
  LEADERBOARDS: 'leaderboards',
  ATTEMPTED: 'attemptedQuestions',
  SESSIONS: 'quizSessions',
};

export const QUESTIONS_PER_SESSION = 10;
export const DAILY_QUESTIONS_COUNT = 10;
export const SECONDS_PER_QUESTION = 45;

/** Difficulty point multipliers */
export const DIFFICULTY_POINTS = {
  easy: 10,
  medium: 15,
  hard: 25,
};

/**
 * Extensible quiz types — add entries here without rewriting session logic.
 * `categories` must match admin UploadQuiz CATEGORIES.
 */
export const QUIZ_TYPES = {
  daily: {
    id: 'daily',
    label: 'Daily Challenge',
    subtitle: 'Fresh questions every day',
    icon: 'calendar-star',
    color: '#F3703E',
    categories: ['bible', 'jesus', 'old', 'new', 'mixed'],
    questionsCount: DAILY_QUESTIONS_COUNT,
    mode: 'daily',
  },
  bible_knowledge: {
    id: 'bible_knowledge',
    label: 'Bible Knowledge Quiz',
    subtitle: 'Test your Scripture knowledge',
    icon: 'book-cross',
    color: '#C96A1B',
    categories: ['bible', 'mixed'],
    questionsCount: QUESTIONS_PER_SESSION,
  },
  old_testament: {
    id: 'old_testament',
    label: 'Old Testament Quiz',
    subtitle: 'From Genesis to Malachi',
    icon: 'book-open-variant',
    color: '#8B6914',
    categories: ['old'],
    questionsCount: QUESTIONS_PER_SESSION,
  },
  new_testament: {
    id: 'new_testament',
    label: 'New Testament Quiz',
    subtitle: 'Gospels, letters, and revelation',
    icon: 'book-open-page-variant',
    color: '#6B8F71',
    categories: ['new'],
    questionsCount: QUESTIONS_PER_SESSION,
  },
  jesus: {
    id: 'jesus',
    label: 'Jesus Quiz',
    subtitle: 'Life, teachings, and salvation',
    icon: 'cross',
    color: '#C9A227',
    categories: ['jesus'],
    questionsCount: QUESTIONS_PER_SESSION,
  },
  apostles: {
    id: 'apostles',
    label: 'Apostles Quiz',
    subtitle: 'The twelve and early church',
    icon: 'account-group',
    color: '#7B6BA8',
    categories: ['bible', 'new', 'mixed'],
    questionsCount: QUESTIONS_PER_SESSION,
    keyword: 'apostle',
  },
  random: {
    id: 'random',
    label: 'Random Challenge',
    subtitle: 'Mixed categories, endless variety',
    icon: 'shuffle-variant',
    color: '#E65A2B',
    categories: ['bible', 'jesus', 'old', 'new', 'mixed'],
    questionsCount: QUESTIONS_PER_SESSION,
    mode: 'random',
  },
};

export const QUIZ_TYPE_LIST = Object.values(QUIZ_TYPES);

export const LEADERBOARD_PERIODS = {
  daily: { id: 'daily', label: 'Daily' },
  weekly: { id: 'weekly', label: 'Weekly' },
  monthly: { id: 'monthly', label: 'Monthly' },
  alltime: { id: 'alltime', label: 'All-Time' },
};

export const XP_PER_CORRECT = 12;
export const XP_PER_QUIZ_COMPLETE = 50;
export const XP_PER_LEVEL = 200;

export const ACHIEVEMENT_DEFS = {
  bible_scholar: {
    id: 'bible_scholar',
    title: 'Bible Scholar',
    description: 'Answer 50 Bible category questions correctly',
    icon: 'book-cross',
    target: 50,
    field: 'categoryCorrect_bible',
  },
  top_10: {
    id: 'top_10',
    title: 'Top 10 Player',
    description: 'Reach top 10 on any leaderboard',
    icon: 'trophy',
    target: 1,
    field: 'reachedTop10',
  },
  streak_7: {
    id: 'streak_7',
    title: '7 Day Streak',
    description: 'Play quizzes 7 days in a row',
    icon: 'fire',
    target: 7,
    field: 'longestStreak',
  },
  streak_30: {
    id: 'streak_30',
    title: '30 Day Streak',
    description: 'Play quizzes 30 days in a row',
    icon: 'fire-circle',
    target: 30,
    field: 'longestStreak',
  },
  correct_100: {
    id: 'correct_100',
    title: '100 Correct Answers',
    description: 'Get 100 answers right across all quizzes',
    icon: 'check-decagram',
    target: 100,
    field: 'totalCorrect',
  },
};
