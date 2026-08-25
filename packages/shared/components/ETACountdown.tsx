// packages/shared/components/ETACountdown.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Clock, AlertTriangle, Wifi } from 'lucide-react-native';
import type { TransitSnapshot } from '../lib/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

function formatMMSS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

interface ETACountdownProps {
  data: TransitSnapshot;
  size?: 'compact' | 'full' | 'kiosk';
}

export function ETACountdown({ data, size = 'full' }: ETACountdownProps) {
  const { T_outbound_sec, T_dwell_sec, T_inbound_sec, T_total_sec } = data.inbound;
  const isDelayed = data.vehicle.leg === 'outbound' && T_outbound_sec > 0;
  const timerFontSize = size === 'kiosk' ? 72 : size === 'compact' ? 40 : 56;

  return (
    <View style={[styles.container, isDelayed && styles.delayedContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={14} color={colors.brand.primary} />
          <Text style={styles.headerLabel}>PREDICTIVE INBOUND ETA</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>GTFS-RT Block Chained</Text>
        </View>
      </View>

      {/* Main timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>BUS ARRIVES IN</Text>
        <Text style={[styles.timer, { fontSize: timerFontSize }, isDelayed && styles.delayedTimer]}>
          {formatMMSS(T_total_sec)}
        </Text>
        {isDelayed ? (
          <View style={styles.delayBanner}>
            <AlertTriangle size={12} color={colors.semantic.danger} />
            <Text style={styles.delayText}>DELAYED - Catch-up Active</Text>
          </View>
        ) : (
          <View style={styles.liveBanner}>
            <Wifi size={12} color={colors.transit.connected} />
            <Text style={styles.liveText}>Live compounding calculation</Text>
          </View>
        )}
      </View>

      {/* Breakdown grid */}
      <View style={styles.breakdown}>
        {[
          { label: 'Prior Leg', value: T_outbound_sec, sub: 'T_outbound', accent: false },
          { label: 'Terminal Halt', value: T_dwell_sec, sub: 'T_dwell', accent: true },
          { label: 'To Stop', value: T_inbound_sec, sub: 'T_inbound', accent: false },
        ].map((item) => (
          <View key={item.label} style={[styles.cell, item.accent && styles.cellAccent]}>
            <Text style={[styles.cellLabel, item.accent && styles.cellLabelAccent]}>{item.label}</Text>
            <Text style={[styles.cellValue, item.accent && styles.cellValueAccent]}>{formatMMSS(item.value)}</Text>
            <Text style={[styles.cellSub, item.accent && styles.cellSubAccent]}>{item.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const MONO = Platform.select({ ios: 'Courier', android: 'monospace' });

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.04)',
    elevation: 1,
    gap: 16,
  },
  delayedContainer: {
    backgroundColor: colors.occupancy.VERY_CROWDED.bg,
    borderColor: colors.occupancy.VERY_CROWDED.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: MONO,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timerSection: {
    alignItems: 'center',
    gap: 4,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timer: {
    fontFamily: MONO,
    fontWeight: '900',
    color: colors.text.primary,
  },
  delayedTimer: {
    color: colors.semantic.danger,
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  delayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  breakdown: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 12,
    gap: 6,
  },
  cell: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    gap: 2,
  },
  cellAccent: {
    backgroundColor: colors.occupancy.MODERATE.bg,
    borderColor: colors.occupancy.MODERATE.border,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  cellLabelAccent: {
    color: colors.occupancy.MODERATE.text,
  },
  cellValue: {
    fontSize: 13,
    fontFamily: MONO,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cellValueAccent: {
    color: colors.brand.primary,
  },
  cellSub: {
    fontSize: 9,
    fontFamily: MONO,
    color: colors.text.muted,
  },
  cellSubAccent: {
    color: colors.brand.primaryDark,
  },
});
