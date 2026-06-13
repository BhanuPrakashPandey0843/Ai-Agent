import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { HomeTheme } from '../theme/homeTheme';
import { Colors } from '../theme/colors';

export function useBibleTheme() {
  const { isDark } = useTheme();

  return useMemo(() => {
    if (isDark) {
      return {
        isDark: true,
        bg: Colors.bgDark,
        surface: Colors.bgCard,
        surfaceAlt: Colors.bgCardLight,
        text: Colors.textPrimary,
        textMuted: Colors.textMuted,
        primary: Colors.primary,
        accent: Colors.primaryLight,
        border: Colors.border,
        shadow: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 6,
        },
        heroGradient: ['#1A1208', '#2A1A0A', Colors.bgCard],
        cardGradient: ['rgba(255,107,0,0.18)', 'rgba(255,107,0,0.04)'],
      };
    }

    return {
      isDark: false,
      bg: HomeTheme.bg,
      surface: HomeTheme.surface,
      surfaceAlt: '#F8F4E8',
      text: HomeTheme.text,
      textMuted: HomeTheme.textMuted,
      primary: HomeTheme.primary,
      accent: HomeTheme.orange,
      border: 'rgba(0,0,0,0.06)',
      shadow: HomeTheme.shadow,
      heroGradient: ['#EEF3FF', '#FFF8EE', HomeTheme.bg],
      cardGradient: ['#E8EFFF', '#FFF4E8'],
    };
  }, [isDark]);
}
