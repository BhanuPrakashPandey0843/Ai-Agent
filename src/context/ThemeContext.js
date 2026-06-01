// src/context/ThemeContext.js — Premium Dark Theme
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { STORAGE_KEYS } from '../constants';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Premium dark theme is DEFAULT

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

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      background: Colors.bgDark,
      surface: Colors.bgCard,
      card: Colors.bgCardLight,
      text: Colors.textPrimary,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      border: 'rgba(255,255,255,0.08)',
      primary: Colors.primary,
      accent: Colors.primary,
    },
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
