export const COLLECTIONS = {
  WALLPAPERS: 'religiousWallpapers',
  DAILY_VERSES: 'dailyVerses',
  DAILY_PRAYERS: 'dailyprayers',
  QUESTIONS: 'questions',
  QUOTES: 'quotes',
  USERS: 'users',
  GODSWORDS: 'studyPlans',
  WITNESS: 'witnessPosts',
  MEET_SHARE: 'meetSessions',
  STORIES: 'stories',
};

/** Wallpaper filters — icon names are MaterialCommunityIcons */
export const CATEGORIES = [
  { id: 'Christian', label: 'Christian', icon: 'cross', color: '#558AFF' },
  { id: 'Islamic', label: 'Islamic', icon: 'star-crescent', color: '#4CAF50' },
  { id: 'Hindu', label: 'Hindu', icon: 'om', color: '#FF6B35' },
  { id: 'Sikh', label: 'Sikh', icon: 'khanda', color: '#FF9800' },
  { id: 'Buddhist', label: 'Buddhist', icon: 'dharmachakra', color: '#9C27B0' },
];

/** Premium welcome carousel — full-screen background images */
export const WELCOME_SLIDES = [
  {
    id: '1',
    image: require('../../assets/welcome.png'),
    tagline: 'Faith Frames',
    title: 'Divine Wallpapers',
    description: 'Christ-centered wallpapers and art for daily inspiration and worship.',
  },
  {
    id: '2',
    image: require('../../assets/welcomeone.png'),
    tagline: 'Daily Inspiration',
    title: 'Verses & Prayers',
    description: 'Daily Bible verses, prayers, and uplifting Christian content.',
  },
  {
    id: '3',
    image: require('../../assets/welcometwo.png'),
    tagline: 'Your Journey',
    title: 'Save & Share',
    description: 'Favorite wallpapers, download in HD, and share your faith with the world.',
  },
];

/** Legacy text slides (kept for reference; welcome uses WELCOME_SLIDES) */
export const ONBOARDING_SLIDES = WELCOME_SLIDES;

export const PAGE_SIZE = 20;

export const STORAGE_KEYS = {
  THEME: 'faithframes_theme',
  ONBOARDING_DONE: 'faithframes_onboarding_done',
  FAVORITES: 'faithframes_favorites',
  DOWNLOADS: 'faithframes_downloads',
  NOTIFICATION_TOKEN: 'faithframes_notif_token',
  QUIZ_QUESTION_CACHE: 'faithframes_quiz_question_cache',
  QUIZ_ATTEMPTED_CACHE: 'faithframes_quiz_attempted_cache',
  QUIZ_ACTIVE_SESSION: 'faithframes_quiz_active_session',
  VERSE_BOOKMARKS: 'faithframes_verse_bookmarks',
  PRAYER_BOOKMARKS: 'faithframes_prayer_bookmarks',
  LIBRARY_CACHE_VERSE: 'faithframes_library_cache_verse',
  LIBRARY_CACHE_PRAYERS: 'faithframes_library_cache_prayers',
  LIBRARY_CACHE_QUOTES: 'faithframes_library_cache_quotes',
  LIBRARY_CACHE_STUDY: 'faithframes_library_cache_study',
  LIBRARY_CACHE_WITNESS: 'faithframes_library_cache_witness',
  LIBRARY_CACHE_MEET: 'faithframes_library_cache_meet',
};

/** Quote categories — mirrors admin UploadQuotesPanel */
export const QUOTE_CATEGORIES = [
  'All',
  'Faith',
  'Hope',
  'Love',
  'Prayer',
  'Wisdom',
  'Courage',
  'Grace',
  'General',
];

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Faith Frames';
export const SUPPORT_EMAIL = 'support@faithframes.app';
export const PRIVACY_POLICY_URL = 'https://faithframes.app/privacy-policy';
export const TERMS_URL = 'https://faithframes.app/terms-and-conditions';
