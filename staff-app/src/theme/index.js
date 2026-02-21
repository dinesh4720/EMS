// Apple-style color palette
export const Colors = {
  // System colors
  blue: '#007AFF',
  brown: '#A2845E',
  cyan: '#32ADE6',
  green: '#34C759',
  indigo: '#5856D6',
  mint: '#00C7BE',
  orange: '#FF9500',
  pink: '#FF2D55',
  purple: '#AF52DE',
  red: '#FF3B30',
  teal: '#30B0C7',
  yellow: '#FFCC00',

  // Grays
  gray: {
    ultraLight: '#F2F2F7',
    light: '#E5E5EA',
    medium: '#C7C7CC',
    dark: '#8E8E93',
    darker: '#636366',
    darkest: '#48484A',
  },

  // Text colors
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
    tertiary: '#C7C7CC',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#E5E5EA',
    group: '#F2F2F7',
  },

  // Semantic colors
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
  },
};

// Typography
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 13,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
