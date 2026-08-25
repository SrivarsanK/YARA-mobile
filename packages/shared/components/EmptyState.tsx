// packages/shared/components/EmptyState.tsx - Phase 3 stub
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Search, Route, MapPin } from 'lucide-react-native';

interface EmptyStateProps {
  message: string;
  icon?: 'search' | 'route' | 'stop';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon = 'search' }) => {
  const Icon = { search: Search, route: Route, stop: MapPin }[icon];
  return (
    <View style={styles.container}>
      <Icon size={48} color={colors.text.muted} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 48 },
  message: { marginTop: 16, fontSize: 16, color: colors.text.muted, textAlign: 'center' },
});
