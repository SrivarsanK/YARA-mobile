// packages/shared/components/LoadingShimmer.tsx - Phase 3 stub
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface LoadingShimmerProps {
  variant?: 'card' | 'list' | 'route';
  count?: number;
}

export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({ variant = 'card', count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.shimmer, styles[variant]]}>
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  shimmer: { marginBottom: 12, backgroundColor: colors.bg.darkSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border.medium },
  card: { height: 100, padding: 16 },
  list: { height: 60, padding: 16 },
  route: { height: 80, padding: 16 },
  line1: { height: 16, borderRadius: 4, backgroundColor: colors.neutral[800], width: '60%', marginBottom: 8 },
  line2: { height: 12, borderRadius: 4, backgroundColor: colors.neutral[800], width: '40%' },
});
