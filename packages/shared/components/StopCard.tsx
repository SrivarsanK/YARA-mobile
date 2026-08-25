// packages/shared/components/StopCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Bus, ChevronRight } from 'lucide-react-native';
import type { NeonStop } from '../lib/types';
import { colors } from '../theme/colors';

export interface StopCardProps {
  stop: NeonStop;
  distanceM?: number;
  walkMin?: number;
  busList?: string[];
  onPress?: () => void;
}

export function StopCard({
  stop,
  distanceM,
  walkMin,
  busList,
  onPress,
}: StopCardProps) {
  const effectiveDistance = distanceM !== undefined ? distanceM : stop.distance_m;
  const distText =
    effectiveDistance !== undefined && effectiveDistance !== null
      ? effectiveDistance >= 1000
        ? `${(effectiveDistance / 1000).toFixed(1)} km`
        : `${Math.round(effectiveDistance)} m`
      : null;

  const walkText =
    walkMin !== undefined
      ? `${walkMin} min walk`
      : effectiveDistance !== undefined && effectiveDistance !== null
      ? `${Math.max(1, Math.round(effectiveDistance / 80))} min walk`
      : null;

  const metaItems = [distText, walkText].filter((item): item is string => Boolean(item));
  const metaString = metaItems.length > 0 ? metaItems.join(' · ') : 'Active Stop';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <MapPin size={20} color={colors.brand.primary} />
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {stop.stop_name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {metaString}
          </Text>
        </View>

        <View style={styles.rightAction}>
          <ChevronRight size={18} color={colors.text.muted} />
        </View>
      </View>

      {busList && busList.length > 0 && (
        <View style={styles.busChipsRow}>
          {busList.slice(0, 6).map((code, idx) => (
            <View key={`${code}-${idx}`} style={styles.busChip}>
              <Bus size={11} color={colors.text.secondary} />
              <Text style={styles.busChipText}>{code}</Text>
            </View>
          ))}
          {busList.length > 6 && (
            <View style={[styles.busChip, styles.busChipMore]}>
              <Text style={styles.busChipMoreText}>+{busList.length - 6}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  rightAction: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  busChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  busChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  busChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  busChipMore: {
    backgroundColor: colors.neutral[200],
    borderColor: colors.border.medium,
  },
  busChipMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});
