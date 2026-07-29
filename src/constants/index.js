export const COLLECTIONS = {
  WALLPAPERS: 'religiousWallpapers',
  DAILY_VERSES: 'dailyVerses',
  DAILY_PRAYERS: 'dailyPrayers',
  QUESTIONS: 'questions',
  QUOTES: 'quotes',
  USERS: 'users',
  GODSWORDS: 'studyPlans',
  WITNESS: 'witnessPosts',
  MEET_SHARE: 'meetSessions',
  STORIES: 'stories',
  FEATURED_STORIES: 'featuredStories',
  WITNESS_VIDEOS: 'witnessVideos',
  WITNESS_CAROUSEL: 'witnessCarousel',
  BIBLE_READING_PLANS: 'bibleReadingPlans',
  BIBLE_DAILY_VERSES: 'bibleDailyVerses',
  BIBLE_BANNERS: 'bibleBanners',
  BIBLE_ANNOUNCEMENTS: 'bibleAnnouncements',
  BIBLE_CONTENT: 'bibleContent',
  BIBLE_CAROUSEL: 'bibleCarousel',
  JESUS_CONTENT: 'jesusContent',
  JESUS_CAROUSEL: 'jesusCarousel',
  PRAYERS_CONTENT: 'prayersContent',
  PRAYERS_CAROUSEL: 'prayersCarousel',
  WORSHIP_CONTENT: 'worshipContent',
  WORSHIP_CAROUSEL: 'worshipCarousel',
  USER_PRAYERS: 'userPrayers',
};

/** Wallpaper filters — icon names are MaterialCommunityIcons */
export const CATEGORIES = [
  { id: 'Christian', label: 'Christian', icon: 'cross', color: '#C96A1B' },
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
  STORY_BOOKMARKS: 'faithframes_story_bookmarks',
  STORY_LIKES: 'faithframes_story_likes',
  STORY_READ: 'faithframes_story_read',
  LIBRARY_CACHE_VERSE: 'faithframes_library_cache_verse',
  LIBRARY_CACHE_PRAYERS: 'faithframes_library_cache_prayers',
  LIBRARY_CACHE_QUOTES: 'faithframes_library_cache_quotes',
  LIBRARY_CACHE_STUDY: 'faithframes_library_cache_study',
  LIBRARY_CACHE_WITNESS: 'faithframes_library_cache_witness',
  LIBRARY_CACHE_MEET: 'faithframes_library_cache_meet',
  LIBRARY_CACHE_STORIES: 'faithframes_library_cache_stories',
  LIBRARY_CACHE_FEATURED_STORIES: 'faithframes_library_cache_featured_stories',
  LIBRARY_CACHE_WITNESS_VIDEOS: 'faithframes_library_cache_witness_videos',
  LIBRARY_CACHE_WITNESS_CAROUSEL: 'faithframes_library_cache_witness_carousel',
  LIBRARY_CACHE_BIBLE_CAROUSEL: 'faithframes_library_cache_bible_carousel',
  LIBRARY_CACHE_BIBLE_CONTENT: 'faithframes_library_cache_bible_content',
  LIBRARY_CACHE_JESUS_CAROUSEL: 'faithframes_library_cache_jesus_carousel',
  LIBRARY_CACHE_JESUS_CONTENT: 'faithframes_library_cache_jesus_content',
  LIBRARY_CACHE_PRAYERS_CAROUSEL: 'faithframes_library_cache_prayers_carousel',
  LIBRARY_CACHE_PRAYERS_CONTENT: 'faithframes_library_cache_prayers_content',
  LIBRARY_CACHE_WORSHIP_CAROUSEL: 'faithframes_library_cache_worship_carousel',
  LIBRARY_CACHE_WORSHIP_CONTENT: 'faithframes_library_cache_worship_content',
  PRAYER_DRAFT: 'faithframes_prayer_draft',
  LIBRARY_CACHE_USER_PRAYERS: 'faithframes_library_cache_user_prayers',
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

export const USER_PRAYER_CATEGORIES = [
  'Myself',
  'Family',
  'Friends',
  'Marriage',
  'Children',
  'Parents',
  'Health',
  'Healing',
  'Education',
  'Career',
  'Financial Needs',
  'Thanksgiving',
  'Guidance',
  'Forgiveness',
  'Protection',
  'Church',
  'Community',
  'Nation',
  'World Peace',
  'Salvation',
  'Other',
];

export const USER_PRAYER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Faith Frames';
export const SUPPORT_EMAIL = 'support@faithframes.app';
export const PRIVACY_POLICY_URL = 'https://faithframes.app/privacy-policy';
export const TERMS_URL = 'https://faithframes.app/terms-and-conditions';
