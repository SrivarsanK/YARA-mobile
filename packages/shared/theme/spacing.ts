// packages/shared/theme/spacing.ts — Layout spacing
// Matches web dashboard spacing system (4pt base unit)

export const spacing = {
  // Base unit: 4pt
  base: 4,

  // Scale
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,

  // Named shortcuts
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,

  // Border radius
  radius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    '2xl': 16,
    '3xl': 20,
    full: 9999,
  },

  // Component-specific spacing
  component: {
    // Card padding
    cardPadding: 16,
    cardPaddingSm: 12,
    cardPaddingLg: 20,

    // Screen padding
    screenPadding: 20,
    screenPaddingSm: 16,
    screenPaddingLg: 24,

    // Gap
    gapXs: 4,
    gapSm: 8,
    gapMd: 12,
    gapLg: 16,
    gapXl: 24,

    // Button
    buttonPaddingHorizontal: 16,
    buttonPaddingVertical: 12,
    buttonPaddingHorizontalSm: 12,
    buttonPaddingVerticalSm: 8,
    buttonPaddingHorizontalLg: 24,
    buttonPaddingVerticalLg: 16,

    // Input
    inputPaddingHorizontal: 16,
    inputPaddingVertical: 12,

    // Bottom sheet
    bottomSheetSnapPoints: ['30%', '60%', '90%'],
    bottomSheetHeaderHeight: 48,

    // Map
    mapPadding: 16,

    // Kiosk
    kioskPadding: 32,
    kioskGap: 24,
  },

  // Shadow/elevation
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;

export type SpacingTokens = typeof spacing;
