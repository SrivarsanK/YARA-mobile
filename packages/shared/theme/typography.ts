// packages/shared/theme/typography.ts � Font scales
// Matches web dashboard typography system

import { Platform } from 'react-native';

const MONO_FAMILY = Platform.select({ ios: 'Courier', android: 'monospace' });

export const typography = {
  // Font families
  fontFamily: {
    sans: 'System',
    mono: MONO_FAMILY,
    brand: 'System',
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },

  // Font sizes (base = 16pt)
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
    '6xl': 48,
    '7xl': 60,
    '8xl': 72,   // Kiosk ETA timer
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },

  // Pre-defined text styles (matches web Tailwind classes)
  styles: {
    // Display
    displayLarge: {
      fontSize: 56,
      fontWeight: '900' as const,
      lineHeight: 64,
      letterSpacing: -1,
      fontFamily: 'System',
    },
    displayMedium: {
      fontSize: 44,
      fontWeight: '800' as const,
      lineHeight: 52,
      letterSpacing: -0.5,
      fontFamily: 'System',
    },
    displaySmall: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 44,
      letterSpacing: 0,
      fontFamily: 'System',
    },

    // Headlines
    headlineLarge: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 38,
      letterSpacing: 0,
      fontFamily: 'System',
    },
    headlineMedium: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: 0,
      fontFamily: 'System',
    },
    headlineSmall: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: 0,
      fontFamily: 'System',
    },

    // Titles
    titleLarge: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
      fontFamily: 'System',
    },
    titleMedium: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0.15,
      fontFamily: 'System',
    },
    titleSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontFamily: 'System',
    },

    // Body
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0.25,
      fontFamily: 'System',
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontFamily: 'System',
    },

    // Labels
    labelLarge: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontFamily: 'System',
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    labelSmall: {
      fontSize: 10,
      fontWeight: '700' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      fontFamily: 'System',
    },

    // Special
    kioskTimer: {
      fontSize: 72,
      fontWeight: '900' as const,
      lineHeight: 80,
      letterSpacing: 2,
      fontFamily: MONO_FAMILY,
      fontVariant: ['tabular-nums'],
    },
    timerCompact: {
      fontSize: 40,
      fontWeight: '900' as const,
      lineHeight: 48,
      letterSpacing: 1,
      fontFamily: MONO_FAMILY,
      fontVariant: ['tabular-nums'],
    },
    timerFull: {
      fontSize: 56,
      fontWeight: '900' as const,
      lineHeight: 64,
      letterSpacing: 1,
      fontFamily: MONO_FAMILY,
      fontVariant: ['tabular-nums'],
    },
    badge: {
      fontSize: 12,
      fontWeight: '700' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    badgeSmall: {
      fontSize: 10,
      fontWeight: '700' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    badgeLarge: {
      fontSize: 14,
      fontWeight: '700' as const,
      lineHeight: 20,
      letterSpacing: 0.5,
      fontFamily: 'System',
    },
    monoSmall: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0,
      fontFamily: MONO_FAMILY,
    },
    monoMedium: {
      fontSize: 13,
      fontWeight: '700' as const,
      lineHeight: 18,
      letterSpacing: 0,
      fontFamily: MONO_FAMILY,
    },
  },
} as const;

export type TypographyTokens = typeof typography;
