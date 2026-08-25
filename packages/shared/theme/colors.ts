// packages/shared/theme/colors.ts — Design tokens
// Matches web dashboard color system exactly

export const colors = {
  // Brand
  brand: {
    primary: '#b17816',      // Amber brand color (web: text-[#b17816])
    primaryDark: '#92400E',
    primaryLight: '#FDE68A',
  },

  // Occupancy bands (from OccupancyBadge spec)
  occupancy: {
    SEATS_AVAILABLE: {
      dot: '#22C55E',
      bg: '#F0FDF4',
      text: '#166534',
      border: '#86EFAC',
    },
    MODERATE: {
      dot: '#EAB308',
      bg: '#FFFBEB',
      text: '#92400E',
      border: '#FCD34D',
    },
    STANDING_ROOM: {
      dot: '#F97316',
      bg: '#FFF7ED',
      text: '#9A3412',
      border: '#FDBA74',
    },
    VERY_CROWDED: {
      dot: '#EF4444',
      bg: '#FFF1F2',
      text: '#9F1239',
      border: '#FCA5A5',
    },
  },

  // Semantic
  semantic: {
    success: '#22C55E',
    warning: '#EAB308',
    danger: '#EF4444',
    info: '#2563EB',
  },

  // Neutral
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Backgrounds
  bg: {
    primary: '#fff',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    dark: '#0F172A',
    darkSecondary: '#1E293B',
  },

  // Borders
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
    focus: '#2563EB',
  },

  // Text
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#F8FAFC',
    brand: '#b17816',
    danger: '#DC2626',
    success: '#15803D',
    warning: '#B45309',
  },

  // Transit specific
  transit: {
    outbound: '#94A3B8',      // Grey for outbound leg
    dwell: '#EAB308',         // Amber for dwell
    inbound: '#22C55E',       // Green for inbound
    inboundBlue: '#2563EB',   // Blue for inbound bus marker
    dwellAmber: '#EAB308',    // Amber for dwell bus marker
    outboundGrey: '#94A3B8',  // Grey for outbound bus marker
    connected: '#2563EB',     // Live signal connected
    disconnected: '#EF4444',  // Live signal disconnected
  },
} as const;

export type ColorTokens = typeof colors;
