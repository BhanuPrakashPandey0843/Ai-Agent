import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Premium palette for the Bible *destination* screens — New/Old Testament,
 * Notes, Bookmarks, Reading Plans. Deliberately separate from
 * `useBibleTheme` (which the Bible Home screen and its 4 cards keep using
 * unchanged) so this redesign never bleeds backwards onto Home.
 *
 * isDark still comes from the app's global ThemeContext, so the existing
 * light/dark toggle keeps working — only the color *values* differ here.
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
      primary: '#D8B36A',
      primarySoft: 'rgba(216,179,106,0.16)',
      border: 'rgba(255,255,255,0.08)',
      divider: 'rgba(255,255,255,0.05)',
      success: '#4ADE80',
      successSoft: 'rgba(74,222,128,0.14)',
      danger: '#F87171',
      overlayStrong: ['rgba(9,9,9,0)', 'rgba(9,9,9,0.55)', 'rgba(9,9,9,0.92)'],
    };
    const light = {
      bg: '#FAF7F2',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF9F0',
      surfaceRaised: '#FFFFFF',
      text: '#232323',
      textMuted: '#6E6E6E',
      textFaint: '#9A9182',
      primary: '#B68C44',
      primarySoft: 'rgba(182,140,68,0.12)',
      border: '#ECE5D8',
      divider: '#F1EBDF',
      success: '#16A34A',
      successSoft: 'rgba(22,163,74,0.12)',
      danger: '#DC2626',
      overlayStrong: ['rgba(250,247,242,0)', 'rgba(35,30,20,0.45)', 'rgba(20,17,12,0.85)'],
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
