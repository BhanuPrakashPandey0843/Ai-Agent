import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export function useBibleTheme() {
  const { isDark, colors } = useTheme();

  return useMemo(
    () => ({
      isDark,
      bg: colors.bg,
      surface: colors.bgCard,
      surfaceAlt: colors.bgCardSoft,
      text: colors.textPrimary,
      textMuted: colors.textMuted,
      primary: colors.primary,
      accent: colors.primaryLight,
      border: colors.border,
      shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: isDark ? 10 : 12,
        elevation: isDark ? 6 : 8,
      },
      heroGradient: isDark
        ? ['#1A1208', '#2A1A0A', colors.bgCard]
        : [colors.divine, colors.bgCardSoft, colors.bg],
      cardGradient: isDark
        ? ['rgba(255,107,0,0.18)', 'rgba(255,107,0,0.04)']
        : [colors.accentSoft, 'rgba(201,106,27,0.04)'],
    }),
    [isDark, colors]
  );
}
