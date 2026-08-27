import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Theme tokens for Reading Plan screens only.
 * Isolated from Bible Home (`useBibleTheme`) and other Bible destination
 * screens (`useBiblePremiumTheme`) so this redesign cannot leak.
 */
export function useReadingPlanTheme() {
  const { isDark } = useTheme();

  return useMemo(() => {
    const accent = '#D4AF37';
    const accentDark = '#B8891E';
    const accentSoft = isDark ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.12)';

    const dark = {
      background: '#1C1C1E',
      surface: '#2C2C2E',
      surfaceSecondary: '#3A3A3C',
      textPrimary: '#F5F1E8',
      textSecondary: '#B8B2A6',
      border: 'rgba(255,255,255,0.08)',
      success: '#4ADE80',
      warning: '#E8C56B',
      heroGradient: ['#2A261C', '#1C1C1E'],
      cardGradient: ['#322E24', '#2C2C2E'],
    };

    const light = {
      background: '#F7F3EA',
      surface: '#FFFFFF',
      surfaceSecondary: '#FBF8F1',
      textPrimary: '#1F1C16',
      textSecondary: '#6F6A60',
      border: 'rgba(31,28,22,0.08)',
      success: '#2F9E5F',
      warning: '#B8891E',
      heroGradient: ['#F4E8C4', '#F7F3EA'],
      cardGradient: ['#FFFBF3', '#FFFFFF'],
    };

    const c = isDark ? dark : light;

    return {
      isDark,
      ...c,
      accent,
      accentDark,
      accentSoft,
      onAccent: '#1A1508',
      space: { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 28: 28, 32: 32, 40: 40 },
      radius: { card: 24, button: 18, progress: 20, chip: 14, round: 999 },
      type: {
        heroTitle: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
        screenTitle: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
        cardTitle: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
        section: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
        body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
        bodySm: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
        caption: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
        button: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
      },
      shadow: isDark
        ? {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 3,
          }
        : {
            shadowColor: '#1F1C16',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 4,
          },
      shadowSoft: isDark
        ? {
            shadowColor: accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 2,
          }
        : {
            shadowColor: '#1F1C16',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          },
      glow: {
        shadowColor: accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isDark ? 0.45 : 0.28,
        shadowRadius: 18,
        elevation: 0,
      },
    };
  }, [isDark]);
}
