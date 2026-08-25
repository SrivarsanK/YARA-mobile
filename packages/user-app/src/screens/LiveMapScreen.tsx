// packages/user-app/src/screens/LiveMapScreen.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import {
  Bus,
  Navigation,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react-native';
import {
  ETACountdown,
  ETABreakdownBar,
  OccupancyBadge,
  LiveSignalIcon,
  TripTimeline,
} from '@yara/shared';
import { useTransit } from '../context/TransitContext';
import { Map } from '../components/Map';
import { LiveMapHeader } from '../components/LiveMapHeader';
import { AgencySelectorModal } from '../components/AgencySelectorModal';
import {
  AGENCY_PRESETS,
  AgencyPreset,
  S26_CORRIDOR_STOPS,
} from '@yara/shared/lib/agencies';

interface RouteChipData {
  code: string;
  destination: string;
  origin: string;
}

const CHENNAI_ACTIVE_ROUTES: RouteChipData[] = [
  { code: 'S26', origin: 'Ashok Pillar', destination: 'To Valasaravakkam' },
  { code: '26G R', origin: 'CMBT', destination: 'To Ramapuram' },
  { code: 'S86', origin: 'Porur', destination: 'To Ramapuram' },
  { code: '70CCT R', origin: 'CMBT', destination: 'To Ramapuram' },
  { code: '21G', origin: 'Tambaram', destination: 'To Broadway' },
  { code: '101', origin: 'Thiruvottiyur', destination: 'To CMBT Koyambedu' },
];

const NEARBY_ARRIVALS = [
  {
    code: 'S26',
    destination: 'To Valasaravakkam',
    etaMin: 11,
    clockTime: '10:17 AM',
    occupancy: 'SEATS_AVAILABLE',
    occupancyLabel: 'Seats Available',
  },
  {
    code: '26G R',
    destination: 'To Ramapuram',
    etaMin: 29,
    clockTime: '10:35 AM',
    occupancy: 'SEATS_AVAILABLE',
    occupancyLabel: 'Seats Available',
  },
  {
    code: 'S86',
    destination: 'To Ramapuram',
    etaMin: 2,
    clockTime: '10:08 AM',
    occupancy: 'MODERATE',
    occupancyLabel: 'Moderate',
  },
  {
    code: '70CCT R',
    destination: 'To Ramapuram',
    etaMin: 8,
    clockTime: '10:14 AM',
    occupancy: 'SEATS_AVAILABLE',
    occupancyLabel: 'Seats Available',
  },
];

export const LiveMapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { data, isConnected, isMockFallback, reconnectAttempts, error } = useTransit();
  const [selectedAgency, setSelectedAgency] = useState<AgencyPreset>(AGENCY_PRESETS[0]);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState<boolean>(false);
  const [activeRouteCode, setActiveRouteCode] = useState<string>('S26');
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLon, setUserLon] = useState<number | undefined>(undefined);
  const [locationActive, setLocationActive] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['32%', '65%', '92%'], []);

  // Request & watch user GPS location
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        setLocationActive(true);

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          (loc) => {
            setUserLat(loc.coords.latitude);
            setUserLon(loc.coords.longitude);
          }
        );
      } catch (err) {
        console.warn('Location fetch error:', err);
      }
    })();

    return () => {
      sub?.remove();
    };
  }, []);

  const leg = data?.vehicle?.leg ?? 'inbound';
  const legStateLabel = useMemo(() => {
    switch (leg) {
      case 'outbound':
        return 'Completing outbound → Arriving on return';
      case 'dwell':
        return 'Terminal Halt / Dwell Recovery';
      default:
        return 'Arriving on inbound return leg';
    }
  }, [leg]);

  const vehicleLat = data?.vehicle?.lat ?? 13.0302;
  const vehicleLon = data?.vehicle?.lon ?? 80.1806;

  const nearestStop = useMemo(() => {
    if (!userLat || !userLon) return S26_CORRIDOR_STOPS[14]; // SRM University
    let closest = S26_CORRIDOR_STOPS[0];
    let minDist = Infinity;
    for (const stop of S26_CORRIDOR_STOPS) {
      const d = Math.hypot(stop.lat - userLat, stop.lon - userLon);
      if (d < minDist) {
        minDist = d;
        closest = stop;
      }
    }
    return closest;
  }, [userLat, userLon]);

  return (
    <ImageBackground
      source={require('../../assets/transit-bg-pattern.png')}
      style={[styles.container, { paddingTop: insets.top }]}
      resizeMode="repeat"
    >
      {/* ── Top Navigation & Search Header ───────────────────────────────── */}
      <LiveMapHeader
        selectedAgency={selectedAgency}
        isConnected={isConnected}
        isMockFallback={isMockFallback}
        reconnectAttempts={reconnectAttempts}
        error={error}
        onOpenAgencySelector={() => setIsAgencyModalOpen(true)}
        onSearchPress={() => navigation.navigate('Search')}
        routeCode={activeRouteCode}
        legStateText={legStateLabel}
        userLocationActive={locationActive}
      />

      {/* ── Active Routes Horizontal Carousel ────────────────────────────── */}
      <View style={styles.routeStripContainer}>
        <View style={styles.routeStripLabelRow}>
          <Text style={styles.routeStripLabel}>ACTIVE ROUTES:</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeChipsScroll}
        >
          {CHENNAI_ACTIVE_ROUTES.map((r) => {
            const isActive = activeRouteCode === r.code;
            return (
              <TouchableOpacity
                key={r.code}
                style={[styles.routeCard, isActive && styles.routeCardActive]}
                onPress={() => setActiveRouteCode(r.code)}
                activeOpacity={0.7}
              >
                <View style={[styles.routeIconBox, isActive && styles.routeIconBoxActive]}>
                  <Bus size={14} color={isActive ? '#0F172A' : '#64748B'} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={[styles.routeCodeText, isActive && styles.routeCodeTextActive]}>
                    {r.code}
                  </Text>
                  <Text style={styles.routeDestText} numberOfLines={1}>
                    {r.destination}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── "Buses around you" Map Area ──────────────────────────────────── */}
      <View style={styles.mapOuterWrapper}>
        <View style={styles.mapCard}>
          {/* Map Header Overlay */}
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapTitleBlock}>
              <Text style={styles.mapSectionTitle}>Buses around you</Text>
            </View>
            <View style={styles.liveTrackingPill}>
              <Text style={styles.liveTrackingText}>Live tracking ›</Text>
            </View>
          </View>

          {/* Interactive Map */}
          <View style={styles.mapViewContainer}>
            <Map
              vehicleLat={vehicleLat}
              vehicleLon={vehicleLon}
              vehicleLeg={leg}
              routeCode={activeRouteCode}
              stops={S26_CORRIDOR_STOPS}
              userLat={userLat}
              userLon={userLon}
              centerLat={13.0302}
              centerLon={80.1806}
              latitudeDelta={0.07}
              longitudeDelta={0.07}
            />
          </View>

          {/* Map Footer Occupancy Density Bar */}
          <View style={styles.densityBanner}>
            <View style={styles.densityBarTrack}>
              <View style={styles.densityBarFill} />
            </View>
            <View style={styles.densityTextRow}>
              <Text style={styles.densityTitle}>Seats Available</Text>
              <Text style={styles.densitySub}>Low · Comfortable</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Slide-up Bottom Sheet (Nearest Bus Stop + Live ETA) ───────────── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent}>
          {/* Section: Nearest bus stop header */}
          <View style={styles.nearestHeaderRow}>
            <Text style={styles.nearestSectionTitle}>Nearest bus stop</Text>
            {locationActive && (
              <View style={styles.gpsActiveBadge}>
                <Navigation size={10} color="#059669" />
                <Text style={styles.gpsActiveText}>GPS Active</Text>
              </View>
            )}
          </View>

          {/* Primary Stop Card */}
          <View style={styles.primaryStopCard}>
            <View style={styles.stopIconDark}>
              <MapPin size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryStopName}>{nearestStop.name}</Text>
              <Text style={styles.primaryStopSub}>Primary Station</Text>
            </View>
            <View style={styles.walkBadge}>
              <Navigation size={11} color="#0284C7" />
              <Text style={styles.walkBadgeText}>4 min walk</Text>
            </View>
          </View>

          {/* Arriving Buses List */}
          <View style={styles.arrivalList}>
            {NEARBY_ARRIVALS.map((arrival, idx) => {
              const isSeats = arrival.occupancy === 'SEATS_AVAILABLE';
              return (
                <View key={idx} style={styles.arrivalCard}>
                  <View style={styles.arrivalBusIconBox}>
                    <Bus size={16} color="#B17816" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.arrivalRouteCode}>{arrival.code}</Text>
                    <Text style={styles.arrivalDestText}>{arrival.destination}</Text>
                  </View>
                  <View style={styles.arrivalRightCol}>
                    <Text style={styles.arrivalClockText}>{arrival.clockTime}</Text>
                    <Text
                      style={[
                        styles.arrivalEtaText,
                        arrival.etaMin <= 2 && { color: '#EF4444' },
                      ]}
                    >
                      {arrival.etaMin} min away
                    </Text>
                    <View
                      style={[
                        styles.occupancyBadgePill,
                        isSeats ? styles.occupancySeats : styles.occupancyModerate,
                      ]}
                    >
                      <View
                        style={[
                          styles.occupancyDotSmall,
                          { backgroundColor: isSeats ? '#10B981' : '#F59E0B' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.occupancyBadgeText,
                          { color: isSeats ? '#065F46' : '#92400E' },
                        ]}
                      >
                        {arrival.occupancyLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Live Compound ETA Details Section */}
          <View style={styles.liveEtaDetailsContainer}>
            <View style={styles.liveEtaHeaderRow}>
              <Text style={styles.liveEtaTitle}>LIVE ETA — BUS {activeRouteCode}</Text>
              <LiveSignalIcon isConnected={isConnected} size={18} />
            </View>

            {data ? (
              <View style={{ gap: 12 }}>
                <ETACountdown data={data} size="full" />

                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownCardLabel}>ETA STAGE BREAKDOWN</Text>
                  <ETABreakdownBar
                    tOut={data.inbound.T_outbound_sec}
                    tDwell={data.inbound.T_dwell_sec}
                    tIn={data.inbound.T_inbound_sec}
                    showLabels
                  />
                </View>

                <OccupancyBadge
                  band={data.inbound.occupancy_band}
                  size="md"
                  showSubtext
                />

                <TripTimeline
                  leg={data.vehicle.leg}
                  progress={data.vehicle.progress}
                  routeCode={activeRouteCode}
                  origin="Ashok Pillar"
                  destination="Valasaravakkam"
                  fare={15}
                />
              </View>
            ) : (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#F7A501" />
                <Text style={styles.loadingBoxText}>Connecting to Yara telemetry stream...</Text>
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Agency Selector Modal */}
      <AgencySelectorModal
        visible={isAgencyModalOpen}
        selectedAgencyId={selectedAgency.id}
        onSelectAgency={(agency) => setSelectedAgency(agency)}
        onClose={() => setIsAgencyModalOpen(false)}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EB', // Authentic website cream background
  },

  // ── Active Routes Horizontal Strip ───────────────────────────────────────
  routeStripContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  routeStripLabelRow: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  routeStripLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  routeChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 140,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  routeCardActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F7A501',
    borderWidth: 1.5,
  },
  routeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeIconBoxActive: {
    backgroundColor: '#F7A501',
  },
  routeInfo: {
    flex: 1,
  },
  routeCodeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  routeCodeTextActive: {
    color: '#92400E',
  },
  routeDestText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  // ── Map Card Wrapper ──────────────────────────────────────────────────────
  mapOuterWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 72,
  },
  mapCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 10,
  },
  mapTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveTrackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTrackingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B17816',
  },
  mapViewContainer: {
    flex: 1,
  },
  densityBanner: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  densityBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  densityBarFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  densityTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  densityTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  densitySub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Bottom Sheet ──────────────────────────────────────────────────────────
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleIndicator: {
    backgroundColor: '#CBD5E1',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 48,
    gap: 12,
  },

  // ── Nearest Stop Section ──────────────────────────────────────────────────
  nearestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nearestSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  gpsActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  primaryStopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stopIconDark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryStopName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  primaryStopSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  walkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  walkBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  // ── Arrivals List ─────────────────────────────────────────────────────────
  arrivalList: {
    gap: 8,
  },
  arrivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  arrivalBusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivalRouteCode: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  arrivalDestText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  arrivalRightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  arrivalClockText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  arrivalEtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  occupancyBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  occupancySeats: {
    backgroundColor: '#ECFDF5',
  },
  occupancyModerate: {
    backgroundColor: '#FEF3C7',
  },
  occupancyDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  occupancyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Live ETA Detail Card ──────────────────────────────────────────────────
  liveEtaDetailsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  liveEtaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveEtaTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  breakdownCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  breakdownCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingBoxText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
