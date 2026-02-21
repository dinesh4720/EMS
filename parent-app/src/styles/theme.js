// Apple-inspired theme for SDK 52
export const colors = {
  bgPrimary: '#f5f5f7',
  bgSecondary: '#ffffff',
  bgTertiary: '#fafafa',
  textPrimary: '#1d1d1f',
  textSecondary: '#6e6e73',
  textTertiary: '#86868b',
  accentBlue: '#0071e3',
  accentGreen: '#34c759',
  accentOrange: '#ff9500',
  accentRed: '#ff3b30',
  accentPurple: '#af52de',
  accentPink: '#ff2d55',
  accentTeal: '#5ac8fa',
  accentIndigo: '#5856d6',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const typography = {
  display: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  section: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.15,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 16,
  },
};
