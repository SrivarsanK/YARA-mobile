// packages/shared/components/RouteCard.tsx - Phase 3 stub
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NeonRoute } from '../lib/types';
import { colors } from '../theme/colors';

interface RouteCardProps {
  route: NeonRoute;
  onPress?: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, onPress }) => (
  <Pressable style={styles.container} onPress={onPress}>
    <Text style={styles.code}>{route.route_short_name}</Text>
    <Text style={styles.name}>{route.route_long_name}</Text>
    <Text style={styles.meta}>{route.stop_count} stops · {Math.round(route.duration_sec / 60)} min</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg.darkSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border.medium },
  code: { fontSize: 18, fontWeight: '700', color: colors.text.inverse },
  name: { fontSize: 14, color: colors.text.secondary, marginTop: 2 },
  meta: { fontSize: 12, color: colors.text.muted, marginTop: 4 },
});
