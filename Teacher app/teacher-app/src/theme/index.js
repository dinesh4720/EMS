export const PALETTE = {
    primary: '#2563EB', // Vibrant Blue
    primaryDark: '#1E40AF',
    primaryLight: '#DBEAFE',
    secondary: '#F472B6', // Pink/Rose
    secondaryLight: '#FCE7F3',
    tertiary: '#10B981', // Emerald
    tertiaryLight: '#D1FAE5',

    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Slate 100

    text: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    textTertiary: '#94A3B8', // Slate 400

    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    highlight: '#6366F1', // Indigo
};

export const COLORS = {
    primary: PALETTE.primary,
    primaryDark: PALETTE.primaryDark,
    primaryLight: PALETTE.primaryLight,
    secondary: PALETTE.secondary,
    secondaryLight: PALETTE.secondaryLight,

    dark: PALETTE.text,
    gray: PALETTE.textSecondary,
    lightGray: '#E2E8F0',
    white: '#FFFFFF',

    fade: PALETTE.background,
    surface: PALETTE.surface,
    surfaceVariant: PALETTE.surfaceVariant,

    success: PALETTE.success,
    danger: PALETTE.danger,
    warning: PALETTE.warning,
    info: PALETTE.info,

    onPrimary: '#FFFFFF',
    onSecondary: '#831843',
};

export const GRADIENTS = {
    primary: ['#2563EB', '#1D4ED8'],
    secondary: ['#F472B6', '#DB2777'],
    success: ['#34D399', '#059669'],
    danger: ['#F87171', '#DC2626'],
    warm: ['#FF9A9E', '#FECFEF'],
    cool: ['#A18CD1', '#FBC2EB'],
    ocean: ['#84FAB0', '#8FD3F4'],
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
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    primary: {
        shadowColor: PALETTE.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    }
};

export const TYPOGRAPHY = {
    h1: { fontSize: 32, fontFamily: 'Inter_700Bold', color: PALETTE.text },
    h2: { fontSize: 24, fontFamily: 'Inter_600SemiBold', color: PALETTE.text },
    h3: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: PALETTE.text },
    body: { fontSize: 16, fontFamily: 'Inter_400Regular', color: PALETTE.textSecondary },
    caption: { fontSize: 13, fontFamily: 'Inter_400Regular', color: PALETTE.textTertiary },
    label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: PALETTE.text },
};
