import { useMemo } from 'react';
import { Platform, PlatformColor, useColorScheme } from 'react-native';

const fallback = {
  light: {
    primary: '#0066CC',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D6E4FF',
    onPrimaryContainer: '#001B3D',
    secondary: '#565F71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DAE2F9',
    onSecondaryContainer: '#131C2B',
    tertiary: '#705575',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FAD8FD',
    onTertiaryContainer: '#28132E',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    surface: '#FEFBFF',
    surfaceContainer: '#F3F3F7',
    surfaceContainerHigh: '#ECECF1',
    onSurface: '#1B1B1F',
    onSurfaceVariant: '#44474E',
    outline: '#74777F',
    outlineVariant: '#C4C6D0',
    inverseSurface: '#303034',
    inverseOnSurface: '#F3F0F4',
    success: '#34C759',
    onSuccess: '#FFFFFF',
    successContainer: '#C8F5D0',
    onSuccessContainer: '#002106',
    warning: '#FF9500',
    onWarning: '#FFFFFF',
    warningContainer: '#FFE8CC',
    onWarningContainer: '#2A1700',
    info: '#007AFF',
    onInfo: '#FFFFFF',
    infoContainer: '#D6E4FF',
    onInfoContainer: '#001B3D',
  },
  dark: {
    primary: '#A8C8FF',
    onPrimary: '#003063',
    primaryContainer: '#00468C',
    onPrimaryContainer: '#D6E4FF',
    secondary: '#BEC6DC',
    onSecondary: '#283041',
    secondaryContainer: '#3E4759',
    onSecondaryContainer: '#DAE2F9',
    tertiary: '#DEBCE0',
    onTertiary: '#3F2844',
    tertiaryContainer: '#573E5C',
    onTertiaryContainer: '#FAD8FD',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    surface: '#1B1B1F',
    surfaceContainer: '#242428',
    surfaceContainerHigh: '#2E2E33',
    onSurface: '#E4E1E6',
    onSurfaceVariant: '#C4C6D0',
    outline: '#8E9099',
    outlineVariant: '#44474E',
    inverseSurface: '#E4E1E6',
    inverseOnSurface: '#303034',
    success: '#6DD47E',
    onSuccess: '#003910',
    successContainer: '#005319',
    onSuccessContainer: '#C8F5D0',
    warning: '#FFB86B',
    onWarning: '#452B00',
    warningContainer: '#633F00',
    onWarningContainer: '#FFE8CC',
    info: '#A8C8FF',
    onInfo: '#003063',
    infoContainer: '#00468C',
    onInfoContainer: '#D6E4FF',
  },
};

const androidDynamic = {
  light: {
    primary: '@android:color/system_accent1_500',
    onPrimary: '@android:color/system_accent1_0',
    primaryContainer: '@android:color/system_accent1_100',
    onPrimaryContainer: '@android:color/system_accent1_900',
    secondary: '@android:color/system_accent2_500',
    onSecondary: '@android:color/system_accent2_0',
    secondaryContainer: '@android:color/system_accent2_100',
    onSecondaryContainer: '@android:color/system_accent2_900',
    tertiary: '@android:color/system_accent3_500',
    onTertiary: '@android:color/system_accent3_0',
    tertiaryContainer: '@android:color/system_accent3_100',
    onTertiaryContainer: '@android:color/system_accent3_900',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    surface: '@android:color/system_neutral1_10',
    surfaceContainer: '@android:color/system_neutral1_50',
    surfaceContainerHigh: '@android:color/system_neutral1_100',
    onSurface: '@android:color/system_neutral1_900',
    onSurfaceVariant: '@android:color/system_neutral2_700',
    outline: '@android:color/system_neutral2_500',
    outlineVariant: '@android:color/system_neutral2_200',
    inverseSurface: '@android:color/system_neutral1_900',
    inverseOnSurface: '@android:color/system_neutral1_50',
  },
  dark: {
    primary: '@android:color/system_accent1_200',
    onPrimary: '@android:color/system_accent1_900',
    primaryContainer: '@android:color/system_accent1_700',
    onPrimaryContainer: '@android:color/system_accent1_50',
    secondary: '@android:color/system_accent2_200',
    onSecondary: '@android:color/system_accent2_900',
    secondaryContainer: '@android:color/system_accent2_700',
    onSecondaryContainer: '@android:color/system_accent2_50',
    tertiary: '@android:color/system_accent3_200',
    onTertiary: '@android:color/system_accent3_900',
    tertiaryContainer: '@android:color/system_accent3_700',
    onTertiaryContainer: '@android:color/system_accent3_50',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    surface: '@android:color/system_neutral1_900',
    surfaceContainer: '@android:color/system_neutral1_800',
    surfaceContainerHigh: '@android:color/system_neutral1_700',
    onSurface: '@android:color/system_neutral1_50',
    onSurfaceVariant: '@android:color/system_neutral2_200',
    outline: '@android:color/system_neutral2_400',
    outlineVariant: '@android:color/system_neutral2_700',
    inverseSurface: '@android:color/system_neutral1_50',
    inverseOnSurface: '@android:color/system_neutral1_900',
  },
};

export const getM3Colors = (scheme) => {
  const isAndroidDynamic =
    Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 31;

  const source = isAndroidDynamic ? androidDynamic[scheme] : fallback[scheme];
  const fallbackSource = fallback[scheme];

  const colors = {};
  Object.keys(fallbackSource).forEach((k) => {
    const v = source[k];
    colors[k] =
      isAndroidDynamic && typeof v === 'string' && v.startsWith('@android:')
        ? PlatformColor(v)
        : v ?? fallbackSource[k];
  });

  return colors;
};

export const useMaterial3Theme = () => {
  const schemeRaw = useColorScheme();
  const scheme = schemeRaw === 'dark' ? 'dark' : 'light';

  return useMemo(() => {
    const colors = getM3Colors(scheme);
    const typography = {
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
    };
    const spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    };
    const shape = {
      cornerSmall: 8,
      cornerMedium: 12,
      cornerLarge: 16,
      cornerXLarge: 28,
      pill: 9999,
    };
    return { scheme, colors, typography, spacing, shape };
  }, [scheme]);
};

export default useMaterial3Theme;
