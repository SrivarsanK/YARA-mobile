// packages/shared/components/RouteCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Bus, ChevronRight } from 'lucide-react-native';
import type { NeonRoute } from '../lib/types';
import { colors } from '../theme/colors';

export interface RouteCardProps {
  route: NeonRoute;
  compact?: boolean;
  onPress?: () => void;
}

export function RouteCard({ route, compact = false, onPress }: RouteCardProps) {
  const durationMin = Math.max(1, Math.round(route.duration_sec / 60));
  const stopsText = `${route.stop_count || 0} stops`;
  const durationText = `${durationMin} min`;
  const fareText = route.fare_inr !== undefined && route.fare_inr !== null ? `₹${route.fare_inr}` : null;

  const metaItems = [stopsText, durationText];
  if (fareText) metaItems.push(fareText);
  const metaString = metaItems.join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.container,
        compact && styles.compactContainer,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leftRow}>
        <View style={[styles.iconBox, compact && styles.compactIconBox]}>
          <Bus size={compact ? 16 : 20} color={colors.text.secondary} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.code, compact && styles.compactCode]}>
              {route.route_short_name}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>MTC</Text>
            </View>
          </View>

          <Text
            style={[styles.name, compact && styles.compactName]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {route.route_long_name}
          </Text>

          {!compact && (
            <Text style={styles.meta} numberOfLines={1}>
              {metaString}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightAction}>
        {compact ? (
          <ChevronRight size={18} color={colors.text.muted} />
        ) : (
          <View style={styles.trackButton}>
            <Text style={styles.trackText}>Track</Text>
            <ChevronRight size={14} color={colors.text.secondary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  compactContainer: {
    padding: 10,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  compactIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginRight: 10,
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  code: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  compactCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.semantic.info,
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 3,
  },
  compactName: {
    fontSize: 12,
    marginBottom: 0,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  rightAction: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});
