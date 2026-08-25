// packages/user-app/src/components/LiveMapHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, ChevronDown, Radio, Activity } from 'lucide-react-native';
import { colors } from '@yara/shared';
import type { AgencyPreset } from '../constants/agencies';

interface LiveMapHeaderProps {
  selectedAgency: AgencyPreset;
  isConnected: boolean;
  onOpenAgencySelector: () => void;
  routeCode?: string;
  legStateText?: string;
}

export const LiveMapHeader: React.FC<LiveMapHeaderProps> = ({
  selectedAgency,
  isConnected,
  onOpenAgencySelector,
  routeCode = 'S26',
  legStateText,
}) => {
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

        {/* Connection Status Pill */}
        <View
          style={[
            styles.statusPill,
            isConnected ? styles.statusPillConnected : styles.statusPillDisconnected,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isConnected ? '#065F46' : '#92400E' },
            ]}
          >
            {isConnected ? 'LIVE FEED' : 'CONNECTING...'}
          </Text>
        </View>
      </View>

      {/* Bottom row: Active Route Info Bar */}
      <View style={styles.routeBar}>
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>BUS {routeCode}</Text>
        </View>
        <Text style={styles.routeDetails} numberOfLines={1}>
          {legStateText || 'Ashok Pillar ➔ Valasaravakkam'}
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
  statusPillConnected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillDisconnected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
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
