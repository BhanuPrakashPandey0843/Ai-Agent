// Premium Faith Frames Design System - Full Light & Dark Mode
export const LightColors = {
  primary: '#C96A1B',
  primaryDark: '#A85612',
  primaryLight: '#E18A3A',
  accent: '#C96A1B',
  accentSoft: 'rgba(201,106,27,0.15)',
  glow: 'rgba(201,106,27,0.35)',
  divine: '#FFF4EB',

  bg: '#F8F9FF',
  bgSecondary: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardSoft: '#FFF4EB',
  surface: '#FFFFFF',
  glass: 'rgba(0,0,0,0.04)',

  textPrimary: '#1A1A2E',
  textSecondary: '#4A4A68',
  textMuted: '#8A8AA0',
  textAccent: '#C96A1B',

  border: 'rgba(0,0,0,0.06)',
  borderAccent: 'rgba(201,106,27,0.25)',

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  gradientPrimary: ['#C96A1B', '#E18A3A'],
  gradientVerse: ['#1A2A6C', '#265077'],
  gradientPrayer: ['#4C1D95', '#6D28D9'],
  gradientWallpaper: ['#5B21B6', '#7C3AED'],
  gradientQuotes: ['#EA580C', '#F97316'],
  gradientStudy: ['#047857', '#10B981'],
  gradientWitness: ['#B45309', '#F59E0B'],
  gradientMeet: ['#0891B2', '#06B6D4'],
  gradientOverlay: ['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)'],
  gradientGlass: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
};

export const DarkColors = {
  primary: '#E18A3A',
  primaryDark: '#C96A1B',
  primaryLight: '#F0A05A',
  accent: '#E18A3A',
  accentSoft: 'rgba(225,138,58,0.15)',
  glow: 'rgba(225,138,58,0.35)',
  divine: '#1A1A2E',

  bg: '#05050A',
  bgSecondary: '#0D0D1A',
  bgCard: '#121224',
  bgCardSoft: '#1A1A33',
  surface: '#121224',
  glass: 'rgba(255,255,255,0.06)',

  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDCC',
  textMuted: '#75758A',
  textAccent: '#E18A3A',

  border: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(225,138,58,0.25)',

  success: '#4ADE80',
  error: '#F87171',
  warning: '#FBBF24',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  gradientPrimary: ['#E18A3A', '#F0A05A'],
  gradientVerse: ['#265077', '#3A6A99'],
  gradientPrayer: ['#6D28D9', '#8B5CF6'],
  gradientWallpaper: ['#7C3AED', '#A78BFA'],
  gradientQuotes: ['#F97316', '#FB923C'],
  gradientStudy: ['#10B981', '#34D399'],
  gradientWitness: ['#F59E0B', '#FBBF24'],
  gradientMeet: ['#06B6D4', '#22D3EE'],
  gradientOverlay: ['transparent', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)'],
  gradientGlass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)'],
};

export const Typography = {
  fontSizeXS: 10,
  fontSizeSM: 12,
  fontSizeMD: 14,
  fontSizeLG: 16,
  fontSizeXL: 18,
  fontSize2XL: 22,
  fontSize3XL: 28,
  fontSize4XL: 36,

  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemiBold: '600',
  fontWeightBold: '700',
  fontWeightExtraBold: '800',

  lineHeightSM: 18,
  lineHeightMD: 22,
  lineHeightLG: 26,
  lineHeightXL: 32,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const Shadows = {
  glow: (isDark) => ({
    shadowColor: isDark ? '#E18A3A' : '#C96A1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  }),
  card: (isDark) => ({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.5 : 0.1,
    shadowRadius: 10,
    elevation: 6,
  }),
  nav: (isDark) => ({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.6 : 0.15,
    shadowRadius: 16,
    elevation: 20,
  }),
};

export const getColors = (isDark) => (isDark ? DarkColors : LightColors);

// Backward compatibility
export const Colors = {
  primary: '#C96A1B',
  primaryDark: '#A85612',
  primaryLight: '#E18A3A',
  accent: '#C96A1B',
  accentSoft: 'rgba(201,106,27,0.15)',
  glow: 'rgba(201,106,27,0.35)',
  divine: '#FFF4EB',

  bgDark: '#0A0A0A',
  bgSecondary: '#121212',
  bgCard: '#1A1A1A',
  bgCardLight: '#222222',
  surface: '#121212',
  glass: 'rgba(255,255,255,0.06)',

  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textMuted: '#757575',
  textAccent: '#E18A3A',

  border: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(201,106,27,0.25)',

  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  gradientPrimary: ['#C96A1B', '#E18A3A'],
  gradientGold: ['#C96A1B', '#E18A3A'],
  gradientOrange: ['#C96A1B', '#E18A3A', '#F0A05A'],
  gradientDark: ['#0A0A0A', '#121212'],
  gradientOverlay: ['transparent', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)'],
  gradientGlass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)'],
};
