// src/context/ThemeContext.js — Full Premium Dark + Light Theme Support
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '../theme/colors';
import { HomeTheme } from '../theme/homeTheme';
import { STORAGE_KEYS } from '../constants';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.THEME).then((val) => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, next ? 'dark' : 'light');
  };

  const theme = useMemo(() => {
    const colors = getColors(isDark);
    return {
      isDark,
      toggleTheme,
      colors: {
        ...colors,
        // For backward compatibility, add some old keys:
        bgDark: colors.bg,
        bgCardLight: colors.bgCard,
        text: colors.textPrimary,
        primaryMuted: colors.accentSoft,
        onPrimary: colors.white,
        error: colors.error,
        success: colors.success,
        textMuted: colors.textMuted,
        border: colors.border,
        accentSoft: colors.accentSoft,
        primary: colors.primary,
        accent: colors.accent,
      },
      Typography,
      Spacing,
      BorderRadius,
      Shadows,
      navTheme: {
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.bg,
          card: colors.bgCard,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
      },
      elevation: (level = 'medium') => {
        if (level === 'high') return Shadows.nav(isDark);
        if (level === 'glow') return Shadows.glow(isDark);
        return Shadows.card(isDark);
      },
    };
  }, [isDark]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
