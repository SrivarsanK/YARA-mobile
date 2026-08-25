// packages/user-app/src/components/LiveMapHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { colors } from '@yara/shared';
import type { AgencyPreset } from '@yara/shared/lib/agencies';

interface LiveMapHeaderProps {
  selectedAgency: AgencyPreset;
  isConnected: boolean;
  isMockFallback?: boolean;
  reconnectAttempts?: number;
  error?: string | null;
  onOpenAgencySelector: () => void;
  routeCode?: string;
  legStateText?: string;
}

export const LiveMapHeader: React.FC<LiveMapHeaderProps> = ({
  selectedAgency,
  isConnected,
  isMockFallback = false,
  reconnectAttempts = 0,
  error: _error,
  onOpenAgencySelector,
  routeCode = 'S26',
  legStateText,
}) => {
  const statusConfig = (() => {
    if (isConnected) {
      return {
        text: 'LIVE FEED',
        dotColor: '#10B981',
        textColor: '#065F46',
        pillStyle: styles.statusPillLive,
      };
    }
    if (isMockFallback || reconnectAttempts >= 5) {
      return {
        text: 'MOCK FEED',
        dotColor: '#EF4444',
        textColor: '#991B1B',
        pillStyle: styles.statusPillMock,
      };
    }
    if (reconnectAttempts > 0) {
      return {
        text: `RECONNECTING ${reconnectAttempts}/5`,
        dotColor: '#F59E0B',
        textColor: '#92400E',
        pillStyle: styles.statusPillReconnecting,
      };
    }
    return {
      text: 'CONNECTING...',
      dotColor: '#3B82F6',
      textColor: '#1E40AF',
      pillStyle: styles.statusPillConnecting,
    };
  })();

  return (
    <View style={styles.container}>
      {/* Top row: Agency selector + Connection Status */}
      <View style={styles.topRow}>
        {/* Agency Selector Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.agencyButton}
          onPress={onOpenAgencySelector}
        >
          <View style={styles.agencyIconWrapper}>
            <MapPin size={14} color="#2563EB" />
          </View>
          <Text style={styles.agencyCity}>{selectedAgency.city}</Text>
          <Text style={styles.agencyShortName}>({selectedAgency.shortName})</Text>
          <ChevronDown size={14} color={colors.text.muted} />
        </TouchableOpacity>

        {/* Connection Status Pill - 4 States */}
        <View style={[styles.statusPill, statusConfig.pillStyle]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusConfig.dotColor },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusConfig.textColor },
            ]}
          >
            {statusConfig.text}
          </Text>
        </View>
      </View>

      {/* Bottom row: Active Route Info Bar */}
      <View style={styles.routeBar}>
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>BUS {routeCode}</Text>
        </View>
        <Text style={styles.routeDetails} numberOfLines={1}>
          {legStateText || 'Ashok Pillar -> Valasaravakkam'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  agencyIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyCity: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
  },
  agencyShortName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusPillLive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillReconnecting: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPillConnecting: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusPillMock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  routeDetails: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    flex: 1,
  },
});
