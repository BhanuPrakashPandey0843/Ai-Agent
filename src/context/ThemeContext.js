// src/context/ThemeContext.js — Dark + Light theme support
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
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
    if (isDark) {
      return {
        isDark: true,
        toggleTheme,
        colors: {
          background: Colors.bgDark,
          surface: Colors.bgCard,
          card: Colors.bgCardLight,
          text: Colors.textPrimary,
          textSecondary: Colors.textSecondary,
          textMuted: Colors.textMuted,
          border: Colors.border,
          primary: Colors.primary,
          accent: Colors.primaryLight,
          primaryMuted: Colors.accentSoft,
          onPrimary: Colors.white,
          error: Colors.error,
          success: Colors.success,
        },
        navTheme: {
          dark: true,
          colors: {
            primary: Colors.primary,
            background: Colors.bgDark,
            card: Colors.bgCard,
            text: Colors.textPrimary,
            border: Colors.border,
            notification: Colors.primary,
          },
        },
        elevation: (level = 'medium') => {
          if (level === 'high') return Colors.card ? {} : ShadowsFallback.high;
          return ShadowsFallback.medium;
        },
      };
    }

    return {
      isDark: false,
      toggleTheme,
      colors: {
        background: HomeTheme.bg,
        surface: HomeTheme.surface,
        card: '#F8F4E8',
        text: HomeTheme.text,
        textSecondary: '#5C5C5C',
        textMuted: HomeTheme.textMuted,
        border: 'rgba(0,0,0,0.08)',
        primary: HomeTheme.primary,
        accent: HomeTheme.orange,
        primaryMuted: '#E8EFFF',
        onPrimary: '#FFFFFF',
        error: Colors.error,
        success: Colors.success,
      },
      navTheme: {
        dark: false,
        colors: {
          primary: HomeTheme.primary,
          background: HomeTheme.bg,
          card: HomeTheme.surface,
          text: HomeTheme.text,
          border: 'rgba(0,0,0,0.08)',
          notification: HomeTheme.orange,
        },
      },
      elevation: (level = 'medium') => {
        if (level === 'high') return ShadowsFallback.highLight;
        return HomeTheme.shadow;
      },
    };
  }, [isDark]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

const ShadowsFallback = {
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  highLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
