// Utility functions for Staff App

import { Platform } from 'react-native';

/**
 * Haptic feedback utility that works across platforms
 */
export const triggerHaptic = async (style = 'light') => {
  if (Platform.OS !== 'web') {
    try {
      const Haptics = require('expo-haptics');
      const styleMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(styleMap[style] || Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail if haptics not available
      console.warn('Haptic feedback not available:', error.message);
    }
  }
};

/**
 * Notification haptic feedback
 */
export const triggerNotificationHaptic = async (type = 'success') => {
  if (Platform.OS !== 'web') {
    try {
      const Haptics = require('expo-haptics');
      const typeMap = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      };
      await Haptics.notificationAsync(typeMap[type] || Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Notification haptic not available:', error.message);
    }
  }
};

/**
 * Format time from 24h to 12h format
 */
export const formatTime = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Format date to readable string
 */
export const formatDate = (date = new Date()) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get day abbreviation
 */
export const getDayAbbrev = (date = new Date()) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Check if a time is in the past
 */
export const isTimePast = (time) => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const checkDate = new Date();
  checkDate.setHours(hours, minutes, 0, 0);
  return now > checkDate;
};

/**
 * Get relative time string
 */
export const getRelativeTime = (time) => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const checkDate = new Date();
  checkDate.setHours(hours, minutes, 0, 0);

  const diffMs = checkDate - now;
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return 'Past';
  if (diffMins === 0) return 'Now';
  if (diffMins < 60) return `In ${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `In ${diffHours}h`;

  return 'Tomorrow';
};

/**
 * Generate a random color for subjects
 */
export const getSubjectColor = (subject) => {
  const colors = {
    'Mathematics': '#FF9500',
    'Physics': '#5856D6',
    'Chemistry': '#34C759',
    'English': '#FF2D55',
    'Biology': '#00C7BE',
    'History': '#FF3B30',
    'Computer Science': '#007AFF',
    'Art': '#AF52DE',
    'Music': '#FFCC00',
    'Physical Education': '#30B0C7',
  };
  return colors[subject] || '#8E8E93';
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};