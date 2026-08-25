// packages/shared/components/EventLog.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Terminal } from 'lucide-react-native';
import type { EventLogEntry } from '../lib/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface EventLogProps {
  events: EventLogEntry[];
  maxVisible?: number;
}

export function EventLog({ events, maxVisible = 10 }: EventLogProps) {
  const visible = [...events].reverse().slice(0, maxVisible);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Terminal size={14} color={colors.semantic.success} />
          <Text style={styles.title}>PIPELINE EVENT LOG</Text>
        </View>
        <Text style={styles.subtitle}>Cause & Effect</Text>
      </View>
      {visible.length === 0 ? (
        <Text style={styles.empty}>Waiting for pipeline events...</Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(_, i) => String(i)}
          scrollEnabled={false}
          style={{ maxHeight: 192 }}
          renderItem={({ item }) => {
            const neg = item.delta_sec < 0;
            const dm = Math.round(item.delta_sec / 60);
            return (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.ts}>{item.ts}</Text>
                  <Text style={styles.event} numberOfLines={1}>{item.event}</Text>
                </View>
                {item.delta_sec !== 0 && (
                  <View style={[styles.delta, { backgroundColor: neg ? '#DCFCE7' : '#FEE2E2', borderColor: neg ? '#86EFAC' : '#FCA5A5' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: neg ? '#166534' : '#991B1B' }}>
                      {neg ? '' : '+'}{dm}m
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    gap: 10,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.04)',
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
    gap: 6,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
  empty: {
    fontSize: 12,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
    textAlign: 'center',
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ts: {
    fontSize: 11,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
  event: {
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  delta: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
});
