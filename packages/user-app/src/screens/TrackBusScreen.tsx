// packages/user-app/src/screens/TrackBusScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bus,
  Navigation,
  Gauge,
  Clock,
  Footprints,
  MapPin,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { useTransitContext } from '../context/TransitContext';
import { Map } from '../components/Map';
import { ETACountdown } from '@yara/shared/components/ETACountdown';
import { OccupancyBadge } from '@yara/shared/components/OccupancyBadge';
import { ETABreakdownBar } from '@yara/shared/components/ETABreakdownBar';
import { LiveSignalIcon } from '@yara/shared/components/LiveSignalIcon';
import { EventLog } from '@yara/shared/components/EventLog';
import { AGENCY_PRESETS, S26_CORRIDOR_STOPS, StopCoordinate } from '@yara/shared/lib/agencies';
import type { TransitSnapshot, OccupancyBand, BusLeg } from '@yara/shared/lib/types';

export const TrackBusScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { data: transitData, isConnected } = useTransitContext();
  const [selectedRouteCode, setSelectedRouteCode] = useState('S26');

  const agency = AGENCY_PRESETS[0]; // MTC Chennai
  const availableRoutes = agency.routes;

  // Fallback snapshot for safety
  const safeData: TransitSnapshot = useMemo(() => {
    if (transitData) return transitData;
    return {
      ts: Date.now(),
      vehicle: {
        lat: 13.03354,
        lon: 80.21209,
        leg: 'inbound' as BusLeg,
        progress: 0.45,
        source: 'gnss',
        trip_id: 'trip_001',
        block_id: 'block_001',
      },
      outbound: { T_outbound_sec: 180 },
      inbound: {
        trip_id: 'trip_001',
        T_total_sec: 660,
        T_outbound_sec: 180,
        T_dwell_sec: 120,
        T_inbound_sec: 360,
        occupancy_band: 'SEATS_AVAILABLE' as OccupancyBand,
      },
      event_log: [],
    };
  }, [transitData]);

  const vehicle = safeData.vehicle;
  const inbound = safeData.inbound;
  const outbound = safeData.outbound;

  const progressPct = Math.min(100, Math.max(0, Math.round(vehicle.progress * 100)));
  const speedKmh = 28.5;
  const distanceCoveredKm = (progressPct * 0.068).toFixed(1);
  const totalDistanceKm = '6.8';

  const tTotal = inbound.T_total_sec;
  const tOut = outbound.T_outbound_sec;
  const tDwell = inbound.T_dwell_sec;
  const tIn = inbound.T_inbound_sec;

  const occupancyBand = inbound.occupancy_band;

  // Stops for map display
  const mapStops = useMemo(() => {
    return S26_CORRIDOR_STOPS.map((s: StopCoordinate, idx: number) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lon: s.lon,
      sequence: idx + 1,
    }));
  }, []);

  const originName = S26_CORRIDOR_STOPS[0]?.name || 'Ashok Pillar';
  const destName = S26_CORRIDOR_STOPS[S26_CORRIDOR_STOPS.length - 1]?.name || 'Valasaravakkam';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBox}>
            <Navigation size={18} color="#B17816" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Live Vehicle Telemetry</Text>
            <Text style={styles.headerSubtitle}>
              Continuous GTFS-RT + Kalman GPS Tracking
            </Text>
          </View>
        </View>

        <View style={styles.livePill}>
          <LiveSignalIcon isConnected={isConnected} />
          <Text style={styles.livePillText}>
            {isConnected ? '1Hz LIVE' : 'SIMULATION'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Bus Quick Selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.sectionLabel}>MONITORED CORRIDORS ({agency.shortName}):</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScroll}
          >
            {availableRoutes.map((code: string) => {
              const isSelected = code === selectedRouteCode;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.routeChip,
                    isSelected && styles.routeChipSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedRouteCode(code)}
                >
                  <Bus
                    size={14}
                    color={isSelected ? '#020617' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.routeChipCode,
                      isSelected && styles.routeChipCodeSelected,
                    ]}
                  >
                    {code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Live GPS Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <View style={styles.mapCardTitleRow}>
              <View style={styles.mapBadge}>
                <Text style={styles.mapBadgeText}>CORRIDOR {selectedRouteCode}</Text>
              </View>
              <Text style={styles.mapRouteTitle} numberOfLines={1}>
                {originName} → {destName}
              </Text>
            </View>
            <View style={styles.gnssStatusBadge}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Text style={styles.gnssStatusTextOnline}>
                {vehicle.source === 'gnss' ? 'GNSS 3D Fix' : 'Kalman Est.'}
              </Text>
            </View>
          </View>

          <View style={styles.mapWrapper}>
            <Map
              vehicleLat={vehicle.lat}
              vehicleLon={vehicle.lon}
              vehicleLeg={vehicle.leg}
              routeCode={selectedRouteCode}
              stops={mapStops}
            />
          </View>
        </View>

        {/* Live HUD: Speed Gauge + Deviation + Distance */}
        <View style={styles.hudGrid}>
          {/* Speed Card */}
          <View style={styles.hudCard}>
            <View style={styles.hudIconRow}>
              <Gauge size={16} color="#0284C7" />
              <Text style={styles.hudCardLabel}>SPEED</Text>
            </View>
            <Text style={styles.hudCardValue}>{speedKmh}</Text>
            <Text style={styles.hudCardUnit}>km/h · Active cruise</Text>
          </View>

          {/* Schedule Deviation */}
          <View style={styles.hudCard}>
            <View style={styles.hudIconRow}>
              <Clock size={16} color="#16A34A" />
              <Text style={styles.hudCardLabel}>LEG STATE</Text>
            </View>
            <Text style={[styles.hudCardValue, { color: '#16A34A', fontSize: 16 }]}>
              {vehicle.leg.toUpperCase()}
            </Text>
            <Text style={styles.hudCardUnit}>Block: {vehicle.block_id}</Text>
          </View>

          {/* Distance Covered */}
          <View style={styles.hudCard}>
            <View style={styles.hudIconRow}>
              <Activity size={16} color="#7C3AED" />
              <Text style={styles.hudCardLabel}>PROGRESS</Text>
            </View>
            <Text style={styles.hudCardValue}>{progressPct}%</Text>
            <Text style={styles.hudCardUnit}>
              {distanceCoveredKm} / {totalDistanceKm} km
            </Text>
          </View>
        </View>

        {/* Live ETA Compound Breakdown */}
        <View style={styles.etaCard}>
          <View style={styles.etaHeader}>
            <View style={styles.etaHeaderLeft}>
              <Zap size={16} color="#F7A501" />
              <Text style={styles.etaHeaderTitle}>COMPOUND ARRIVAL PREDICTION</Text>
            </View>
            <View style={styles.etaFormulaBadge}>
              <Text style={styles.etaFormulaText}>T_total = T_out + T_dwell + T_in</Text>
            </View>
          </View>

          <ETACountdown data={safeData} size="compact" />

          <View style={styles.etaBarBox}>
            <ETABreakdownBar tOut={tOut} tDwell={tDwell} tIn={tIn} />
          </View>
        </View>

        {/* Multimodal Journey & Step Progression */}
        <View style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <View style={styles.journeyHeaderLeft}>
              <Layers size={16} color="#0F172A" />
              <Text style={styles.journeyTitle}>Multimodal Journey Steps</Text>
            </View>
            <Text style={styles.fareBadge}>₹25 Fare</Text>
          </View>

          {/* Step 1: Walk */}
          <View style={styles.stepRow}>
            <View style={styles.stepIconBoxBlue}>
              <Footprints size={18} color="#0284C7" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Walk to Primary Station</Text>
              <Text style={styles.stepSubtitle}>0.2 km · ~3 min walking time</Text>
            </View>
            <View style={styles.stepDonePill}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Text style={styles.stepDoneText}>Ready</Text>
            </View>
          </View>

          {/* Step 2: Bus */}
          <View style={[styles.stepRow, styles.stepRowActive]}>
            <View style={styles.stepIconBoxAmber}>
              <Bus size={18} color="#020617" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                Board Bus {selectedRouteCode} ({vehicle.leg})
              </Text>
              <Text style={styles.stepSubtitle}>
                {mapStops.length} stops · ETA ~{Math.max(1, Math.round(tTotal / 60))} mins
              </Text>
            </View>
            <View style={styles.stepLivePill}>
              <View style={styles.stepLiveDot} />
              <Text style={styles.stepLiveText}>TRACKING</Text>
            </View>
          </View>

          {/* Step 3: Destination */}
          <View style={styles.stepRow}>
            <View style={styles.stepIconBoxEmerald}>
              <MapPin size={18} color="#16A34A" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{destName}</Text>
              <Text style={styles.stepSubtitle}>Final Destination Terminal</Text>
            </View>
            <ArrowRight size={14} color="#94A3B8" />
          </View>
        </View>

        {/* Live Passenger Density */}
        <OccupancyBadge band={occupancyBand} size="lg" />

        {/* Live SSE Telemetry Event Log */}
        {safeData.event_log && safeData.event_log.length > 0 && (
          <EventLog events={safeData.event_log} maxVisible={4} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 96,
    gap: 16,
  },

  /* ── Header ────────────────────────────────────────────── */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },

  /* ── Fleet Selector ────────────────────────────────────── */
  selectorSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  selectorScroll: {
    gap: 8,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  routeChipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F7A501',
    boxShadow: '0 2px 6px rgba(247, 165, 1, 0.25)',
  },
  routeChipCode: {
    fontSize: 13,
    fontWeight: '900',
    color: '#334155',
  },
  routeChipCodeSelected: {
    color: '#020617',
  },

  /* ── Map Card ──────────────────────────────────────────── */
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mapCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  mapBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mapBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  mapRouteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  gnssStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gnssStatusTextOnline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },

  mapWrapper: {
    height: 240,
    width: '100%',
  },

  /* ── HUD Grid ──────────────────────────────────────────── */
  hudGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  hudCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
  },
  hudIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  hudCardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  hudCardUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  /* ── ETA Card ──────────────────────────────────────────── */
  etaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  etaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  etaFormulaBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  etaFormulaText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  etaBarBox: {
    marginTop: 4,
  },

  /* ── Multimodal Journey ────────────────────────────────── */
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journeyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journeyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  fareBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B17816',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  stepRowActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F7A501',
    borderWidth: 1.5,
    boxShadow: '0 2px 6px rgba(247, 165, 1, 0.15)',
  },
  stepIconBoxBlue: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconBoxAmber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F7A501',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconBoxEmerald: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  stepDonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepDoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  stepLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#92400E',
  },
  stepLiveText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
  },
});
