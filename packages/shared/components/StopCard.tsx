// packages/shared/components/StopCard.tsx - Phase 3 stub
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { NeonStop, BusArrival } from '../lib/types';
import { colors } from '../theme/colors';
import { OccupancyBadge } from './OccupancyBadge';

interface StopCardProps {
  stop: NeonStop;
  buses: BusArrival[];
  onPress?: () => void;
}

export const StopCard: React.FC<StopCardProps> = ({ stop, buses, onPress }) => (
  <Pressable style={styles.container} onPress={onPress}>
    <View style={styles.header}>
      <Text style={styles.name}>{stop.stop_name}</Text>
      <Text style={styles.distance}>{stop.distance_m ? Math.round(stop.distance_m) + 'm' : ''}</Text>
    </View>
    <FlatList
      data={buses}
      keyExtractor={b => b.vehicle_id}
      renderItem={({ item }) => (
        <View style={styles.busRow}>
          <Text style={styles.busCode}>{item.route_code}</Text>
          <OccupancyBadge band={item.occupancy_band} size="sm" />
          <Text style={styles.eta}>{Math.round(item.eta_seconds / 60)} min</Text>
        </View>
      )}
    />
  </Pressable>
);

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg.darkSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border.medium },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text.inverse },
  distance: { fontSize: 12, color: colors.text.muted },
  busRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  busCode: { fontSize: 13, fontWeight: '600', color: colors.text.inverse, minWidth: 40 },
  eta: { fontSize: 13, color: colors.text.secondary, marginLeft: 'auto' },
});
