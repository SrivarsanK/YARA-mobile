// packages/user-app/src/screens/LiveMapScreen.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  ETACountdown,
  ETABreakdownBar,
  OccupancyBadge,
  LiveSignalIcon,
  TripTimeline,
  colors,
} from '@yara/shared';
import { useTransit } from '../context/TransitContext';
import { Map } from '../components/Map';
import { LiveMapHeader } from '../components/LiveMapHeader';
import { AgencySelectorModal } from '../components/AgencySelectorModal';
import { AGENCY_PRESETS, AgencyPreset, S26_CORRIDOR_STOPS } from '../constants/agencies';

export const LiveMapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { data, isConnected } = useTransit();
  const [selectedAgency, setSelectedAgency] = useState<AgencyPreset>(AGENCY_PRESETS[0]);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState<boolean>(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for Bottom Sheet: 30%, 60%, 90%
  const snapPoints = useMemo(() => ['30%', '60%', '90%'], []);

  // Compute dynamic leg state label
  const leg = data?.vehicle?.leg ?? 'inbound';
  const legStateLabel = useMemo(() => {
    switch (leg) {
      case 'outbound':
        return 'Completing outbound -> Arriving on return';
      case 'dwell':
        return 'Terminal Halt / Dwell Recovery';
      case 'inbound':
      default:
        return 'Arriving on inbound return leg';
    }
  }, [leg]);

  const vehicleLat = data?.vehicle?.lat ?? 13.0302;
  const vehicleLon = data?.vehicle?.lon ?? 80.1806;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header with Connection Pill & Agency Selector */}
      <LiveMapHeader
        selectedAgency={selectedAgency}
        isConnected={isConnected}
        onOpenAgencySelector={() => setIsAgencyModalOpen(true)}
        routeCode="S26"
        legStateText={legStateLabel}
      />

      {/* Main Map View Area */}
      <View style={styles.mapContainer}>
        <Map
          vehicleLat={vehicleLat}
          vehicleLon={vehicleLon}
          vehicleLeg={leg}
          routeCode="S26"
          stops={S26_CORRIDOR_STOPS}
          centerLat={13.0302}
          centerLon={80.1806}
          latitudeDelta={0.12}
          longitudeDelta={0.12}
        />
      </View>

      {/* Floating Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent}>
          {/* Sheet Header Row with LiveSignalIcon */}
          <View style={styles.sheetHeaderRow}>
            <View style={styles.sheetTitleBlock}>
              <Text style={styles.sheetRouteCode}>BUS S26 | CHENNAI CORRIDOR</Text>
              <Text style={styles.sheetLegStateText}>{legStateLabel}</Text>
            </View>
            <View style={styles.signalIconWrapper}>
              <LiveSignalIcon isConnected={isConnected} size={22} />
            </View>
          </View>

          {/* Real-time Content when Stream is active */}
          {data ? (
            <View style={styles.dataContent}>
              {/* ETACountdown */}
              <ETACountdown data={data} size="full" />

              {/* ETABreakdownBar */}
              <View style={styles.cardContainer}>
                <Text style={styles.sectionLabel}>ETA STAGE BREAKDOWN</Text>
                <ETABreakdownBar
                  tOut={data.inbound.T_outbound_sec}
                  tDwell={data.inbound.T_dwell_sec}
                  tIn={data.inbound.T_inbound_sec}
                  showLabels={true}
                />
              </View>

              {/* Occupancy Density Badge */}
              <OccupancyBadge
                band={data.inbound.occupancy_band}
                size="md"
                showSubtext={true}
              />

              {/* Trip Timeline */}
              <TripTimeline
                leg={data.vehicle.leg}
                progress={data.vehicle.progress}
                routeCode="S26"
                origin="Ashok Pillar"
                destination="Valasaravakkam"
                fare={15}
              />
            </View>
          ) : (
            /* Styled Loading State matching reference aesthetics */
            <View style={styles.loadingContainer}>
              <View style={styles.spinnerCircle}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
              <Text style={styles.loadingTitle}>CONNECTING TO YARA STREAM</Text>
              <Text style={styles.loadingSubtitle}>
                Synchronizing real-time telemetry and predictive ETA...
              </Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Agency Selector Modal */}
      <AgencySelectorModal
        visible={isAgencyModalOpen}
        selectedAgencyId={selectedAgency.id}
        onSelectAgency={(agency) => setSelectedAgency(agency)}
        onClose={() => setIsAgencyModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleIndicator: {
    backgroundColor: colors.neutral[300],
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sheetTitleBlock: {
    flex: 1,
  },
  sheetRouteCode: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sheetLegStateText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  signalIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataContent: {
    gap: 16,
  },
  cardContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  spinnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loadingTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 0.8,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
