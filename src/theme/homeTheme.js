/** Faith Frames — Christian-themed home UI tokens */
export const HomeTheme = {
  bg: '#FDFBF0',
  surface: '#FFFFFF',
  searchBg: '#FFFFFF',
  text: '#2D2D2D',
  textMuted: '#9A9A9A',
  primary: '#C96A1B',
  gold: '#D4AF37',
  orange: '#F3703E',
  coinBg: '#FFEFC7',
  coinText: '#5C4A1F',
  coinStar: '#F5A623',
  navBg: '#FFFFFF',
  navInactive: '#B0B0B0',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
};

/** Home row categories — maps to Firestore wallpaper category where noted */
export const STORY_CATEGORIES = [
  {
    id: 'bible',
    label: 'Bible',
    icon: 'book-cross',
    iconColor: '#C96A1B',
    bowl: '#FFF4EB',
    text: '#A85612',
    category: { id: 'Christian', label: 'Christian' },
  },
  {
    id: 'jesus',
    label: 'Jesus',
    icon: 'cross',
    iconColor: '#C9A227',
    bowl: '#FFF8E7',
    text: '#8B6914',
    category: { id: 'Christian', label: 'Christian' },
  },
  {
    id: 'prayer',
    label: 'Prayer',
    icon: 'hands-pray',
    iconColor: '#6B8F71',
    bowl: '#E8F5E9',
    text: '#2E6B3A',
    category: { id: 'Christian', label: 'Christian' },
  },
  {
    id: 'worship',
    label: 'Worship',
    icon: 'church',
    iconColor: '#7B6BA8',
    bowl: '#EDE8F5',
    text: '#4A3D6E',
    category: { id: 'Christian', label: 'Christian' },
  },
];

export const FEATURED_STORIES = [
  {
    id: 'christ-jesus',
    title: 'The Life of Jesus',
    tag: 'Gospel',
    icon: 'cross',
    colors: ['#1a2a4a', '#3d5a9a', '#D4AF37'],
    category: { id: 'Christian', label: 'Christian' },
  },
  {
    id: 'christ-resurrection',
    title: 'Resurrection & Hope',
    tag: 'Easter',
    icon: 'white-balance-sunny',
    colors: ['#4a6741', '#8fbc8f', '#f0e68c'],
    category: { id: 'Christian', label: 'Christian' },
  },
  {
    id: 'christ-psalms',
    title: 'Psalms & Praise',
    tag: 'Worship',
    icon: 'music-note',
    colors: ['#2c1810', '#8b4513', '#daa520'],
    category: { id: 'Christian', label: 'Christian' },
  },
];
