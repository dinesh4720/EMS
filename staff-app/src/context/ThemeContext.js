import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getM3Colors } from '../theme/material3';

const THEME_KEY = '@staff_app_theme_v2';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemeMode(saved);
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback(async (mode) => {
    if (!['light', 'dark', 'system'].includes(mode)) return;
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const currentScheme = themeMode === 'system' ? systemColorScheme : themeMode;
    const newMode = currentScheme === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  }, [themeMode, systemColorScheme, setTheme]);

  const effectiveScheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const isDark = effectiveScheme === 'dark';

  const colors = useMemo(() => getM3Colors(effectiveScheme), [effectiveScheme]);

  const typography = useMemo(() => ({
    displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '600', letterSpacing: 0 },
    headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600', letterSpacing: 0 },
    headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: 0 },
    titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: 0 },
    titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 0.15 },
    titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0.1 },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.5 },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25 },
    bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.4 },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0.1 },
    labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.5 },
    labelSmall: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.5 },
  }), []);

  const spacing = useMemo(() => ({
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    x1: 8,
    x2: 16,
    x3: 24,
    x4: 32,
    x5: 40,
    x6: 48,
  }), []);

  const shape = useMemo(() => ({
    cornerSmall: 8,
    cornerMedium: 12,
    cornerLarge: 16,
    cornerXLarge: 28,
    pill: 9999,
  }), []);

  const shadows = useMemo(() => ({
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  }), [isDark]);

  const value = useMemo(() => ({
    scheme: effectiveScheme,
    isDark,
    themeMode,
    setTheme,
    toggleTheme,
    colors,
    typography,
    spacing,
    shape,
    shadows,
    isLoaded,
  }), [effectiveScheme, isDark, themeMode, setTheme, toggleTheme, colors, typography, spacing, shape, shadows, isLoaded]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
