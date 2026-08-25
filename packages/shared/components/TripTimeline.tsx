// packages/shared/components/TripTimeline.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Flag, ArrowRight, Truck, Coffee, MapPinCheck } from 'lucide-react-native';
import type { BusLeg } from '../lib/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface TripTimelineProps {
  leg: BusLeg;
  progress: number;
  origin: string;
  destination: string;
  routeCode: string;
  fare?: number;
}

const LEG_CONFIG: Record<BusLeg, { label: string; icon: React.ReactNode; color: string; progressBase: number }> = {
  outbound: {
    label: 'Outbound',
    icon: <Truck size={18} color={colors.transit.outbound} />,
    color: colors.transit.outbound,
    progressBase: 0,
  },
  dwell: {
    label: 'Terminal Halt',
    icon: <Coffee size={18} color={colors.transit.dwell} />,
    color: colors.transit.dwell,
    progressBase: 0.5,
  },
  inbound: {
    label: 'Inbound',
    icon: <MapPinCheck size={18} color={colors.transit.inbound} />,
    color: colors.transit.inbound,
    progressBase: 1,
  },
};

export function TripTimeline({ leg, progress, origin, destination, routeCode, fare }: TripTimelineProps) {
  const legs: BusLeg[] = ['outbound', 'dwell', 'inbound'];
  const currentLegIndex = legs.indexOf(leg);
  const effectiveProgress = progress * (currentLegIndex + 1) / 3;
  const progressWidth = effectiveProgress * 100;

  return (
    <View style={styles.container}>
      {/* Route header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.routeBadge}>
            <Text style={styles.routeCode}>{routeCode}</Text>
          </View>
          <Text style={styles.routeLabel}>{origin} \u2192 {destination}</Text>
        </View>
        {fare !== undefined && (
          <Text style={styles.fare}>\u20B9{fare}</Text>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: progressWidth },
            ]}
          />
          {/* Leg markers */}
          {legs.map((l, i) => {
            const cfg = LEG_CONFIG[l];
            const isActive = i === currentLegIndex;
            const isCompleted = i < currentLegIndex;
            const markerPosition = (i + 1) / 3 * 100;

            return (
              <View
                key={l}
                style={[
                  styles.marker,
                  { left: markerPosition },
                  isCompleted && styles.markerCompleted,
                  isActive && styles.markerActive,
                ]}
              >
                <View
                  style={[
                    styles.markerDot,
                    { backgroundColor: isCompleted ? cfg.color : colors.border.medium },
                    isActive && { backgroundColor: colors.transit.dwell, borderWidth: 3, borderColor: colors.transit.dwell },
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Leg labels */}
        <View style={styles.legLabels}>
          {legs.map((l, i) => {
            const cfg = LEG_CONFIG[l];
            const isActive = i === currentLegIndex;
            const isCompleted = i < currentLegIndex;
            return (
              <View key={l} style={[styles.legLabel, { flex: 1 }]}>
                <Text
                  style={[
                    styles.legLabelText,
                    isCompleted && styles.legLabelCompleted,
                    isActive && styles.legLabelActive,
                  ]}
                >
                  {cfg.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Step cards */}
      <View style={styles.steps}>
        {legs.map((l, i) => {
          const cfg = LEG_CONFIG[l];
          const isActive = i === currentLegIndex;
          const isCompleted = i < currentLegIndex;

          let stepProgress = 0;
          if (isCompleted) stepProgress = 1;
          else if (isActive) stepProgress = progress;

          return (
            <View
              key={l}
              style={[
                styles.step,
                isActive && styles.stepActive,
                isCompleted && styles.stepCompleted,
              ]}
            >
              <View style={styles.stepLeft}>
                <View
                  style={[
                    styles.stepIconBox,
                    isActive && styles.stepIconBoxActive,
                    isCompleted && styles.stepIconBoxCompleted,
                  ]}
                >
                  {cfg.icon}
                </View>
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isActive && styles.stepTitleActive,
                      isCompleted && styles.stepTitleCompleted,
                    ]}
                  >
                    {cfg.label}
                  </Text>
                  <Text style={styles.stepSub}>
                    {i === 0 ? origin : i === 1 ? 'Terminal Dwell' : destination}
                  </Text>
                </View>
              </View>
              <View style={styles.stepRight}>
                <Text
                  style={[
                    styles.stepProgress,
                    isActive && styles.stepProgressActive,
                  ]}
                >
                  {Math.round(stepProgress * 100)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.component.cardPadding,
    borderRadius: 16,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.component.gapLg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.brand.primary,
  },
  routeCode: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.mono,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  fare: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    position: 'relative',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: colors.transit.inboundBlue,
  },
  marker: {
    position: 'absolute',
    top: -6,
    transform: [{ translateX: -8 }],
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.bg.primary,
  },
  markerCompleted: {},
  markerActive: {
    zIndex: 10,
  },
  legLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  legLabel: {
    alignItems: 'center',
  },
  legLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.muted,
  },
  legLabelCompleted: {
    color: colors.text.primary,
  },
  legLabelActive: {
    color: colors.transit.dwell,
    fontWeight: '800',
  },
  steps: {
    gap: spacing.component.gapMd,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.component.gapMd,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.component.gapMd,
  },
  stepActive: {
    borderColor: colors.transit.dwell,
    backgroundColor: colors.occupancy.MODERATE.bg,
  },
  stepCompleted: {
    borderColor: colors.transit.inbound,
    backgroundColor: '#F0FDF4',
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.component.gapMd,
    flex: 1,
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconBoxActive: {
    backgroundColor: colors.occupancy.MODERATE.bg,
    borderColor: colors.transit.dwell,
  },
  stepIconBoxCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.transit.inbound,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepTitleActive: {
    color: colors.transit.dwell,
  },
  stepTitleCompleted: {
    color: colors.transit.inbound,
  },
  stepSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stepRight: {
    alignItems: 'flex-end',
  },
  stepProgress: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
  stepProgressActive: {
    color: colors.transit.dwell,
  },
});
