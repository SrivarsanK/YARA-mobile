// packages/shared/components/ETABreakdownBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ETABreakdownBarProps {
  tOut: number;
  tDwell: number;
  tIn: number;
  showLabels?: boolean;
}

function fmtMin(sec: number): string {
  return Math.round(sec / 60) + ' min';
}

export function ETABreakdownBar({ tOut, tDwell, tIn, showLabels = true }: ETABreakdownBarProps) {
  const total = tOut + tDwell + tIn || 1;
  const pOut = (tOut / total) * 100;
  const pDwell = (tDwell / total) * 100;
  const pIn = (tIn / total) * 100;

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <View style={[styles.seg, { flex: pOut, backgroundColor: colors.transit.outbound }]} />
        <View style={[styles.seg, { flex: pDwell, backgroundColor: colors.transit.dwell }]} />
        <View style={[styles.seg, { flex: pIn, backgroundColor: colors.transit.inbound }]} />
      </View>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={[styles.lbl, { color: colors.text.muted }]}>Outbound {fmtMin(tOut)}</Text>
          <Text style={[styles.lbl, { color: colors.brand.primaryDark }]}>Dwell {fmtMin(tDwell)}</Text>
          <Text style={[styles.lbl, { color: colors.semantic.success }]}>Inbound {fmtMin(tIn)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.neutral[200] },
  seg: { height: '100%' },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  lbl: { fontSize: 10, fontWeight: '600', fontFamily: typography.fontFamily.mono },
});
