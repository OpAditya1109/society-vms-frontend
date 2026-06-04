// src/theme/index.js
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * Society VMS colour palette
 * Primary  : Deep Blue   #1565C0
 * Secondary: Teal        #00897B
 * Error    : Red         #C62828
 * Warning  : Amber       #F9A825
 * Success  : Green       #2E7D32
 */
const palette = {
  primary: '#1565C0',
  primaryContainer: '#D6E4FF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#001C45',

  secondary: '#00897B',
  secondaryContainer: '#B2DFDB',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#003732',

  error: '#C62828',
  errorContainer: '#FDECEA',
  onError: '#FFFFFF',

  warning: '#F9A825',
  success: '#2E7D32',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F8',
  onBackground: '#1A1C1E',
  onSurface: '#1A1C1E',
  onSurfaceVariant: '#44474F',

  outline: '#74777F',
  outlineVariant: '#C4C7CF',

  // Role accent colours
  residentAccent: '#1565C0',
  guardAccent: '#E65100',
  adminAccent: '#4A148C',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...palette,
  },
  // Custom tokens accessible as theme.spacing, theme.radius
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    round: 999,
  },
  typography: {
    displayLarge:  { fontSize: 57, lineHeight: 64, fontWeight: '400' },
    headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '600' },
    headlineMedium:{ fontSize: 28, lineHeight: 36, fontWeight: '600' },
    titleLarge:    { fontSize: 22, lineHeight: 28, fontWeight: '600' },
    titleMedium:   { fontSize: 16, lineHeight: 24, fontWeight: '600' },
    bodyLarge:     { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    bodyMedium:    { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    bodySmall:     { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    labelLarge:    { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    labelMedium:   { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#0D3A7A',
    secondary: '#80CBC4',
    background: '#0F1923',
    surface: '#1C2833',
    surfaceVariant: '#242E3D',
    onBackground: '#E1E2E8',
    onSurface: '#E1E2E8',
  },
};

/** Returns the role-specific accent colour */
export const getRoleColor = (role, fallback = palette.primary) => {
  const map = {
    resident: palette.residentAccent,
    guard: palette.guardAccent,
    admin: palette.adminAccent,
  };
  return map[role] ?? fallback;
};
