// packages/shared/components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Search,
  Route,
  MapPin,
  Bus,
  AlertCircle,
  Clock,
  WifiOff,
  Inbox,
} from 'lucide-react-native';
import { colors } from '../theme/colors';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  search: Search,
  route: Route,
  stop: MapPin,
  'map-pin': MapPin,
  bus: Bus,
  alert: AlertCircle,
  clock: Clock,
  'wifi-off': WifiOff,
  inbox: Inbox,
};

export function EmptyState({ icon = 'search', title, message }: EmptyStateProps) {
  const IconComponent = (icon && ICON_MAP[icon.toLowerCase()]) || Search;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <IconComponent size={28} color={colors.brand.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
});
