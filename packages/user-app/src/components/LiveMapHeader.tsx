// packages/user-app/src/components/LiveMapHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MapPin, ChevronDown, Navigation, Search, Mic } from 'lucide-react-native';
import type { AgencyPreset } from '@yara/shared/lib/agencies';
import { YaraAnimatedLogo } from './YaraAnimatedLogo';

interface LiveMapHeaderProps {
  selectedAgency: AgencyPreset;
  isConnected: boolean;
  isMockFallback?: boolean;
  reconnectAttempts?: number;
  error?: string | null;
  onOpenAgencySelector: () => void;
  onSearchPress?: () => void;
  routeCode?: string;
  legStateText?: string;
  userLocationActive?: boolean;
}

export const LiveMapHeader: React.FC<LiveMapHeaderProps> = ({
  selectedAgency,
  isConnected,
  isMockFallback = false,
  reconnectAttempts = 0,
  error: _error,
  onOpenAgencySelector,
  onSearchPress,
  routeCode = 'S26',
  legStateText,
  userLocationActive = false,
}) => {
  const statusConfig = (() => {
    if (isConnected) {
      return {
        text: '1Hz Live Pipeline',
        dotColor: '#10B981',
        textColor: '#065F46',
        pillStyle: styles.statusPillLive,
      };
    }
    if (isMockFallback || reconnectAttempts >= 5) {
      return {
        text: 'Mock Feed',
        dotColor: '#EF4444',
        textColor: '#991B1B',
        pillStyle: styles.statusPillMock,
      };
    }
    if (reconnectAttempts > 0) {
      return {
        text: `Reconnecting ${reconnectAttempts}/5`,
        dotColor: '#F59E0B',
        textColor: '#92400E',
        pillStyle: styles.statusPillReconnecting,
      };
    }
    return {
      text: 'Connecting...',
      dotColor: '#3B82F6',
      textColor: '#1E40AF',
      pillStyle: styles.statusPillConnecting,
    };
  })();

  return (
    <View style={styles.container}>
      {/* Top Navbar Row */}
      <View style={styles.topRow}>
        {/* YARA Logo */}
        <View style={styles.logoWrapper}>
          <YaraAnimatedLogo width={110} height={36} animate={true} />
        </View>

        {/* Right Action Items */}
        <View style={styles.rightActions}>
          {/* 1Hz Live Pipeline / Status pill */}
          <View style={[styles.statusPill, statusConfig.pillStyle]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.text}
            </Text>
          </View>

          {/* Agency / City Selector button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.agencyButton}
            onPress={onOpenAgencySelector}
          >
            <MapPin size={12} color="#F7A501" />
            <Text style={styles.agencyCity}>{selectedAgency.city}</Text>
            <ChevronDown size={12} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar (Matches Web Home view) */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.searchBar}
        onPress={onSearchPress}
      >
        <Search size={16} color="#94A3B8" />
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          Search bus number, stop or destination...
        </Text>
        <Mic size={16} color="#94A3B8" />
      </TouchableOpacity>
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
    borderBottomColor: '#E2E8F0',
    gap: 10,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
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
  },
  agencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agencyCity: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
