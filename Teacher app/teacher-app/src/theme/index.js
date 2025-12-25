export const COLORS = {
    primary: '#F97316', // Vibrant Orange
    primaryLight: '#FFEDD5', // Light Orange Background
    secondary: '#3B82F6', // Blue for contrast actions
    dark: '#1F2937', // Main Text
    gray: '#6B7280', // Secondary Text
    lightGray: '#E5E7EB', // Borders
    fade: '#F9FAFB', // Backgrounds
    white: '#FFFFFF',
    black: '#000000',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    blue: '#3B82F6',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
};

export const TYPOGRAPHY = {
    header: { fontSize: 32, fontWeight: '800', fontFamily: 'System', color: '#222222' },
    title: { fontSize: 24, fontWeight: '700', fontFamily: 'System', color: '#222222' },
    subtitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System', color: '#222222' },
    body: { fontSize: 16, fontWeight: '400', fontFamily: 'System', color: '#222222' },
    caption: { fontSize: 14, fontWeight: '400', fontFamily: 'System', color: '#717171' },
    tiny: { fontSize: 12, fontWeight: '500', fontFamily: 'System', color: '#717171' },
};
