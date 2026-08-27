import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Premium palette for Bible destination screens — Old/New Testament,
 * Notes, and Bookmarks. Matches the warm orange used on Bible Home cards
 * (`#C96A1B` / `#E18A3A`), not the previous gold (`#D8B36A` / `#B68C44`).
 *
 * isDark still comes from the app's global ThemeContext.
 */
export function useBiblePremiumTheme() {
  const { isDark } = useTheme();

  return useMemo(() => {
    const dark = {
      bg: '#090909',
      surface: '#121212',
      surfaceAlt: '#181818',
      surfaceRaised: '#1B1B1B',
      text: '#FFFFFF',
      textMuted: '#B7B7B7',
      textFaint: '#7A7A7A',
      primary: '#E18A3A',
      primarySoft: 'rgba(225,138,58,0.16)',
      onPrimary: '#1A1008',
      border: 'rgba(225,138,58,0.22)',
      divider: 'rgba(255,255,255,0.05)',
      success: '#4ADE80',
      successSoft: 'rgba(74,222,128,0.14)',
      danger: '#F87171',
      overlayStrong: ['rgba(9,9,9,0)', 'rgba(9,9,9,0.55)', 'rgba(9,9,9,0.92)'],
    };
    const light = {
      bg: '#FFF8F3',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF4EB',
      surfaceRaised: '#FFFFFF',
      text: '#232323',
      textMuted: '#6E6E6E',
      textFaint: '#8A7A6C',
      primary: '#C96A1B',
      primarySoft: 'rgba(201,106,27,0.12)',
      onPrimary: '#FFFFFF',
      border: 'rgba(201,106,27,0.18)',
      divider: '#F3E8DC',
      success: '#16A34A',
      successSoft: 'rgba(22,163,74,0.12)',
      danger: '#DC2626',
      overlayStrong: ['rgba(255,248,243,0)', 'rgba(40,22,10,0.40)', 'rgba(28,14,6,0.82)'],
    };
    const c = isDark ? dark : light;

    return {
      isDark,
      ...c,
      radius: 22,
      radiusSm: 14,
      shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: isDark ? 14 : 12,
        elevation: isDark ? 8 : 6,
      },
      shadowSoft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 6,
        elevation: 3,
      },
    };
  }, [isDark]);
}
