// packages/shared/components/OccupancyBadge.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { OccupancyBand } from '../lib/types';
import { colors } from '../theme/colors';

const BAND_CONFIG: Record<OccupancyBand, {
  label: string;
  subtext: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  SEATS_AVAILABLE: {
    label: 'Seats Available',
    subtext: 'Plenty of room onboard (<40 pax)',
    dotColor: colors.occupancy.SEATS_AVAILABLE.dot,
    bgColor: colors.occupancy.SEATS_AVAILABLE.bg,
    textColor: colors.occupancy.SEATS_AVAILABLE.text,
    borderColor: colors.occupancy.SEATS_AVAILABLE.border,
  },
  MODERATE: {
    label: 'Moderate Crowd',
    subtext: 'Seating mostly filled (40–48 pax)',
    dotColor: colors.occupancy.MODERATE.dot,
    bgColor: colors.occupancy.MODERATE.bg,
    textColor: colors.occupancy.MODERATE.text,
    borderColor: colors.occupancy.MODERATE.border,
  },
  STANDING_ROOM: {
    label: 'Standing Room Only',
    subtext: 'Seats filled, standing area active (48–55 pax)',
    dotColor: colors.occupancy.STANDING_ROOM.dot,
    bgColor: colors.occupancy.STANDING_ROOM.bg,
    textColor: colors.occupancy.STANDING_ROOM.text,
    borderColor: colors.occupancy.STANDING_ROOM.border,
  },
  VERY_CROWDED: {
    label: 'Very Crowded',
    subtext: 'Near maximum capacity (>55 pax)',
    dotColor: colors.occupancy.VERY_CROWDED.dot,
    bgColor: colors.occupancy.VERY_CROWDED.bg,
    textColor: colors.occupancy.VERY_CROWDED.text,
    borderColor: colors.occupancy.VERY_CROWDED.border,
  },
};

interface OccupancyBadgeProps {
  band: OccupancyBand;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export function OccupancyBadge({ band, size = 'md', showSubtext = true }: OccupancyBadgeProps) {
  const cfg = BAND_CONFIG[band] ?? BAND_CONFIG.SEATS_AVAILABLE;
  const pulse = useSharedValue(1);

  // Pulse on VERY_CROWDED (matches web animate-pulse)
  useEffect(() => {
    if (band === 'VERY_CROWDED') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );
    } else {
      pulse.value = 1;
    }
  }, [band]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const iconSize = size === 'lg' ? 24 : size === 'sm' ? 14 : 18;
  const fontSize = size === 'lg' ? 14 : size === 'sm' ? 10 : 12;
  const badgeFontSize = size === 'lg' ? 14 : size === 'sm' ? 10 : 12;

  return (
    <View style={[styles.container, { borderColor: colors.border.light }]}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Users size={iconSize} color={colors.brand.primary} />
        </View>
        {showSubtext && (
          <View>
            <Text style={styles.label}>PASSENGER OCCUPANCY DENSITY</Text>
            <Text style={[styles.subtext, { fontSize }]}>{cfg.subtext}</Text>
          </View>
        )}
      </View>
      <View style={[styles.badge, { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }]}>
        <Animated.View style={[styles.dot, { backgroundColor: cfg.dotColor }, pulseStyle]} />
        <Text style={[styles.badgeText, { color: cfg.textColor, fontSize: badgeFontSize }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtext: {
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontWeight: '700',
  },
});
