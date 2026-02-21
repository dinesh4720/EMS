import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme, { colors } from '../theme';
import CONFIG from '../config';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
      if (storedTheme) {
        setThemeMode(storedTheme);
      } else {
        // Default to light theme
        setThemeMode('light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (mode) => {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.THEME, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const isDark = themeMode === 'dark';

  const themeColors = {
    ...colors,
    // Dark mode adjustments
    background: isDark ? '#121212' : '#ffffff',
    backgroundSecondary: isDark ? '#1e1e1e' : '#f5f5f5',
    backgroundTertiary: isDark ? '#2a2a2a' : '#f0f0f0',
    surface: isDark ? '#1e1e1e' : '#ffffff',
    surfaceVariant: isDark ? '#252525' : '#f8f8f8',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    textTertiary: isDark ? '#707070' : '#999999',
    border: isDark ? '#333333' : '#e5e5e5',
    borderLight: isDark ? '#2a2a2a' : '#f0f0f0',
  };

  const value = {
    theme: themeMode,
    themeColors,
    isDark,
    setTheme,
    toggleTheme,
    ...theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
