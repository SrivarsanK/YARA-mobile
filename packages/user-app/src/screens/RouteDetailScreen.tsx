// packages/user-app/src/screens/RouteDetailScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DimensionValue,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  Bus,
  Calendar,
  Clock,
  Flag,
  MapPin,
  X,
  Star,
} from 'lucide-react-native';
import {
  colors,
  NeonRoute,
  NeonStop,
  OccupancyBand,
  EmptyState,
  LoadingShimmer,
  LiveSignalIcon,
  S26_CORRIDOR_STOPS,
  StopCoordinate,
  BLOCK_ID,
} from '@yara/shared';
import { useRoutes } from '../context/RoutesContext';
import { useTransit } from '../context/TransitContext';
import { RootStackParamList, ScreenNavigationProp } from '../navigation/types';
import { Map } from '../components/Map';

type RouteDetailNavProp = RouteProp<RootStackParamList, 'RouteDetail'>;

interface ScheduleItem {
  time: string;
  status: 'completed' | 'live' | 'scheduled';
  liveEta?: number;
}

export const RouteDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute<RouteDetailNavProp>();

  const routeIdParam = route.params?.routeId || '13311';
  const initialDirection = route.params?.directionId ?? 0;

  const {
    routes,
    fetchStopsForRoute,
    userLocation,
  } = useRoutes();
  const { data: transitData, isConnected } = useTransit();

  const [directionId, setDirectionId] = useState<number>(initialDirection);
  const [stops, setStops] = useState<NeonStop[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState<boolean>(true);
  const [selectedStop, setSelectedStop] = useState<NeonStop | null>(null);
  const [timetableStop, setTimetableStop] = useState<NeonStop | null>(null);

  // Find route metadata
  const currentRouteMeta: NeonRoute | undefined = useMemo(() => {
    return (
      routes.find(
        (r) =>
          r.route_id === routeIdParam ||
          r.route_short_name.toLowerCase() === routeIdParam.toLowerCase()
      ) || {
        route_id: routeIdParam,
        route_short_name: routeIdParam === '13311' ? 'S26' : routeIdParam,
        route_long_name:
          directionId === 0
            ? 'Ashok Pillar TO Valasaravakkam'
            : 'Valasaravakkam TO Ashok Pillar',
        route_type: 3,
        direction_id: directionId,
        stop_count: 19,
        duration_sec: 1500,
        fare_inr: 15,
      }
    );
  }, [routes, routeIdParam, directionId]);

  // Fetch stops when route or direction changes
  useEffect(() => {
    let isMounted = true;

    const loadStops = async () => {
      setIsLoadingStops(true);
      try {
        const fetchedStops = await fetchStopsForRoute(
          routeIdParam,
          directionId
        );
        if (isMounted) {
          if (fetchedStops && fetchedStops.length > 0) {
            setStops(fetchedStops);
            setSelectedStop(fetchedStops[0]);
          } else {
            const fallback: NeonStop[] = S26_CORRIDOR_STOPS.map((s, idx) => ({
              stop_id: s.id,
              stop_name: s.name,
              stop_lat: s.lat,
              stop_lon: s.lon,
              stop_sequence: idx + 1,
            }));
            setStops(fallback);
            setSelectedStop(fallback[0]);
          }
        }
      } catch (err) {
        console.error('[RouteDetailScreen] Failed to load stops:', err);
      } finally {
        if (isMounted) {
          setIsLoadingStops(false);
        }
      }
    };

    loadStops();

    return () => {
      isMounted = false;
    };
  }, [routeIdParam, directionId, fetchStopsForRoute]);

  // Convert stops to Map coordinate format
  const mapStops: StopCoordinate[] = useMemo(() => {
    if (stops.length > 0) {
      return stops.map((s) => ({
        id: s.stop_id,
        name: s.stop_name,
        lat: s.stop_lat,
        lon: s.stop_lon,
      }));
    }
    return S26_CORRIDOR_STOPS;
  }, [stops]);

  const vehicleLat = transitData?.vehicle?.lat ?? 13.0302;
  const vehicleLon = transitData?.vehicle?.lon ?? 80.1806;
  const vehicleLeg = transitData?.vehicle?.leg ?? 'inbound';
  const inboundSec = transitData?.inbound?.T_inbound_sec ?? 300;
  const totalSec = transitData?.inbound?.T_total_sec ?? 1500;
  const occupancyBand = transitData?.inbound?.occupancy_band ?? 'SEATS_AVAILABLE';

  // Find nearest stop to vehicle
  const activeBusStopIdx = useMemo(() => {
    if (stops.length === 0) return 0;
    return stops.reduce((closestIdx, currStop, i) => {
      const closestStop = stops[closestIdx];
      const distCurr = Math.hypot(
        currStop.stop_lat - vehicleLat,
        currStop.stop_lon - vehicleLon
      );
      const distClosest = Math.hypot(
        closestStop.stop_lat - vehicleLat,
        closestStop.stop_lon - vehicleLon
      );
      return distCurr < distClosest ? i : closestIdx;
    }, 0);
  }, [stops, vehicleLat, vehicleLon]);

  // Find nearest stop to user GPS
  const nearestUserStopIdx = useMemo(() => {
    if (
      stops.length === 0 ||
      userLocation?.lat === null ||
      userLocation?.lon === null
    ) {
      return 0;
    }
    const uLat = userLocation.lat;
    const uLon = userLocation.lon;
    return stops.reduce((closestIdx, currStop, i) => {
      const closestStop = stops[closestIdx];
      const distCurr = Math.hypot(currStop.stop_lat - uLat, currStop.stop_lon - uLon);
      const distClosest = Math.hypot(closestStop.stop_lat - uLat, closestStop.stop_lon - uLon);
      return distCurr < distClosest ? i : closestIdx;
    }, 0);
  }, [stops, userLocation]);

  // Occupancy configuration
  const occupancyConfig = useMemo(() => {
    const DCFG: Record<
      OccupancyBand,
      {
        label: string;
        sublabel: string;
        dot: string;
        bg: string;
        text: string;
        border: string;
        bar: string;
        barPct: number;
      }
    > = {
      SEATS_AVAILABLE: {
        label: 'Seats Available',
        sublabel: 'Low · Comfortable',
        dot: '#22C55E',
        bg: '#F0FDF4',
        text: '#166534',
        border: '#86EFAC',
        bar: '#22C55E',
        barPct: 25,
      },
      MODERATE: {
        label: 'Standing Room',
        sublabel: 'Medium · Space available',
        dot: '#EAB308',
        bg: '#FFFBEB',
        text: '#92400E',
        border: '#FCD34D',
        bar: '#EAB308',
        barPct: 50,
      },
      STANDING_ROOM: {
        label: 'Almost Full',
        sublabel: 'High · Limited standing',
        dot: '#F97316',
        bg: '#FFF7ED',
        text: '#9A3412',
        border: '#FDBA74',
        bar: '#F97316',
        barPct: 75,
      },
      VERY_CROWDED: {
        label: 'Overcrowded',
        sublabel: 'No standing space',
        dot: '#EF4444',
        bg: '#FFF1F2',
        text: '#9F1239',
        border: '#FCA5A5',
        bar: '#EF4444',
        barPct: 100,
      },
    };
    return DCFG[occupancyBand] ?? DCFG.SEATS_AVAILABLE;
  }, [occupancyBand]);

  // Schedule timetable data
  const scheduleTimes: ScheduleItem[] = useMemo(() => {
    const liveMin = Math.max(1, Math.round(inboundSec / 60));
    return [
      { time: '06:30 AM', status: 'completed' },
      { time: '07:15 AM', status: 'completed' },
      { time: '08:00 AM', status: 'live', liveEta: liveMin },
      { time: '08:15 AM', status: 'scheduled' },
      { time: '08:30 AM', status: 'scheduled' },
      { time: '08:45 AM', status: 'scheduled' },
      { time: '09:00 AM', status: 'scheduled' },
      { time: '09:30 AM', status: 'scheduled' },
      { time: '10:00 AM', status: 'scheduled' },
      { time: '10:30 AM', status: 'scheduled' },
      { time: '11:00 AM', status: 'scheduled' },
      { time: '11:30 AM', status: 'scheduled' },
    ];
  }, [inboundSec]);

  // Origin & Destination names
  const routeOrigin = useMemo(() => {
    if (currentRouteMeta?.route_long_name?.includes(' TO ')) {
      return currentRouteMeta.route_long_name.split(' TO ')[0].trim();
    }
    return stops[0]?.stop_name || 'Ashok Pillar';
  }, [currentRouteMeta, stops]);

  const routeDestination = useMemo(() => {
    if (currentRouteMeta?.route_long_name?.includes(' TO ')) {
      return currentRouteMeta.route_long_name.split(' TO ')[1].trim();
    }
    return stops[stops.length - 1]?.stop_name || 'Valasaravakkam';
  }, [currentRouteMeta, stops]);

  // Render header above the stops timeline FlatList
  const renderListHeader = () => (
    <View style={styles.headerStack}>
      {/* Interactive Map Section */}
      <View style={styles.mapContainer}>
        <Map
          vehicleLat={vehicleLat}
          vehicleLon={vehicleLon}
          vehicleLeg={vehicleLeg}
          routeCode={currentRouteMeta?.route_short_name || 'S26'}
          stops={mapStops}
          onSelectStop={(s) => {
            const matched = stops.find((st) => st.stop_id === s.id);
            if (matched) setSelectedStop(matched);
          }}
        />

        {/* Live Signal Floating Badge */}
        <View style={styles.mapLiveBadge}>
          <LiveSignalIcon isConnected={isConnected} />
          <Text style={styles.mapLiveText}>
            {isConnected ? 'LIVE FEED' : 'SIMULATION'}
          </Text>
        </View>
      </View>

      {/* Direction Segment Toggle */}
      <View style={styles.segmentControl}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            directionId === 0 && styles.segmentBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => setDirectionId(0)}
        >
          <Text
            style={[
              styles.segmentText,
              directionId === 0 && styles.segmentTextActive,
            ]}
          >
            Outbound (To {routeDestination})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            directionId === 1 && styles.segmentBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => setDirectionId(1)}
        >
          <Text
            style={[
              styles.segmentText,
              directionId === 1 && styles.segmentTextActive,
            ]}
          >
            Return (To {routeOrigin})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Route Overview & Capacity Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewTopRow}>
          <Text style={styles.overviewBadge}>BUS OVERVIEW</Text>
          <Text style={styles.blockText}>
            GTFS Block: {transitData?.vehicle?.block_id || BLOCK_ID}
          </Text>
        </View>

        <View style={styles.routeHeaderRow}>
          <View style={styles.busIconBox}>
            <Bus size={20} color="#B17816" />
          </View>
          <View style={styles.routeHeaderInfo}>
            <Text style={styles.routeNameText} numberOfLines={1}>
              {routeOrigin} → {routeDestination}
            </Text>
            <Text style={styles.routeMetaText}>
              {stops.length} stops · Estimated leg time:{' '}
              {Math.round(totalSec / 60)} mins
            </Text>
          </View>
        </View>

        {/* Passenger Density Bar */}
        <View
          style={[
            styles.densityCard,
            {
              backgroundColor: occupancyConfig.bg,
              borderColor: occupancyConfig.border,
            },
          ]}
        >
          <View style={styles.densityHeader}>
            <View style={styles.densityLabelRow}>
              <View
                style={[
                  styles.densityDot,
                  { backgroundColor: occupancyConfig.dot },
                ]}
              />
              <Text
                style={[
                  styles.densityTitle,
                  { color: occupancyConfig.text },
                ]}
              >
                Passenger Density · {occupancyConfig.label}
              </Text>
            </View>
            <Text
              style={[
                styles.densitySublabel,
                { color: occupancyConfig.text },
              ]}
            >
              {occupancyConfig.sublabel}
            </Text>
          </View>

          <View style={styles.densityBarTrack}>
            <View
              style={[
                styles.densityBarFill,
                {
                  backgroundColor: occupancyConfig.bar,
                  width: (occupancyConfig.barPct + '%') as DimensionValue,
                },
              ]}
            />
          </View>

          <View style={styles.densityScaleLabels}>
            <Text style={styles.scaleText}>Empty</Text>
            <Text style={styles.scaleText}>Seated (40)</Text>
            <Text style={styles.scaleText}>Full (55)</Text>
          </View>
        </View>
      </View>

      {/* Timeline Section Title */}
      <View style={styles.timelineSectionHeader}>
        <View style={styles.timelineHeaderLeft}>
          <Clock size={16} color="#0F172A" />
          <Text style={styles.timelineTitle}>Bus Stop Route Timeline</Text>
        </View>
        <Text style={styles.timelineTotalStops}>
          {stops.length} Stops Total
        </Text>
      </View>
    </View>
  );

  // Render each stop item along the Chalo-style timeline
  const renderStopItem = ({ item, index }: { item: NeonStop; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === stops.length - 1;
    const isNearestBus = index === activeBusStopIdx;
    const isUserNearest = index === nearestUserStopIdx;
    const isSelected = selectedStop?.stop_id === item.stop_id;

    const stopProgressFraction =
      stops.length > 1 ? index / (stops.length - 1) : 0;
    const stopEtaMin = Math.max(1, Math.round((totalSec * stopProgressFraction) / 60));

    return (
      <TouchableOpacity
        style={[
          styles.stopRow,
          isSelected && styles.stopRowSelected,
        ]}
        activeOpacity={0.8}
        onPress={() => setSelectedStop(item)}
      >
        {/* Timeline Line & Node Dot */}
        <View style={styles.timelineColumn}>
          {/* Top Line */}
          <View
            style={[
              styles.timelineLine,
              isFirst && styles.timelineLineHidden,
            ]}
          />

          {/* Node Dot */}
          <View style={styles.nodeWrapper}>
            {isNearestBus ? (
              <View style={styles.busNode}>
                <Bus size={11} color="#FFFFFF" />
              </View>
            ) : isFirst ? (
              <View style={styles.startNode} />
            ) : isLast ? (
              <View style={styles.endNode}>
                <Flag size={9} color="#FFFFFF" />
              </View>
            ) : (
              <View
                style={[
                  styles.regularNode,
                  isSelected && styles.regularNodeSelected,
                ]}
              />
            )}
          </View>

          {/* Bottom Line */}
          <View
            style={[
              styles.timelineLine,
              isLast && styles.timelineLineHidden,
            ]}
          />
        </View>

        {/* Stop Details */}
        <View style={styles.stopContent}>
          {isUserNearest && (
            <View style={styles.userNearestBadge}>
              <MapPin size={10} color="#166534" />
              <Text style={styles.userNearestText}>NEAREST BUS STOP</Text>
            </View>
          )}

          <View style={styles.stopTitleRow}>
            <Text
              style={[
                styles.stopNameText,
                isSelected && styles.stopNameTextSelected,
              ]}
              numberOfLines={1}
            >
              {item.stop_name}
            </Text>
            {isSelected && (
              <TouchableOpacity
                onPress={() => setTimetableStop(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewScheduleLink}>Timetable</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Expanded Info Box */}
          {isSelected && (
            <View style={styles.stopExpandedBox}>
              <View style={styles.stopExpandedLeft}>
                <Text style={styles.stopArrivalText}>
                  {isNearestBus
                    ? 'Vehicle approaching · ~' + Math.max(1, Math.round(inboundSec / 60)) + ' min away'
                    : 'Next arrival in ~' + stopEtaMin + ' min'}
                </Text>
                <Text style={styles.stopSequenceText}>
                  Stop {index + 1} of {stops.length} · Sequence #{item.stop_sequence || index + 1}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.timetableBtn}
                activeOpacity={0.8}
                onPress={() => setTimetableStop(item)}
              >
                <Calendar size={13} color="#92400E" />
                <Text style={styles.timetableBtnText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topHeaderCenter}>
          <View style={styles.routeCodeBadge}>
            <Text style={styles.routeCodeText}>
              BUS {currentRouteMeta?.route_short_name || 'S26'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topHeaderSubtitle} numberOfLines={1}>
              To {routeDestination}
            </Text>
          </View>
        </View>

        <View style={styles.liveHeaderBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveHeaderText}>LIVE</Text>
        </View>
      </View>

      {/* Main Stops List */}
      <FlatList
        data={stops}
        keyExtractor={(item, index) =>
          item.stop_id || 'stop-' + item.stop_name + '-' + index
        }
        renderItem={renderStopItem}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoadingStops ? (
            <View style={styles.loaderContainer}>
              <LoadingShimmer rows={5} />
            </View>
          ) : (
            <EmptyState
              icon="stop"
              title="No stops available"
              message="No route stops found for this direction."
            />
          )
        }
      />

      {/* Stop Timetable Modal */}
      {timetableStop && (
        <Modal
          visible={Boolean(timetableStop)}
          transparent
          animationType="fade"
          onRequestClose={() => setTimetableStop(null)}
        >
          <TouchableWithoutFeedback onPress={() => setTimetableStop(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={styles.modalIconBox}>
                        <Calendar size={20} color="#B17816" />
                      </View>
                      <View style={styles.modalTitleContainer}>
                        <View style={styles.modalBadgeRow}>
                          <View style={styles.modalRoutePill}>
                            <Text style={styles.modalRoutePillText}>
                              Route {currentRouteMeta?.route_short_name || 'S26'}
                            </Text>
                          </View>
                          <Text style={styles.modalSub}>Daily Schedule</Text>
                        </View>
                        <Text style={styles.modalStopTitle} numberOfLines={2}>
                          {timetableStop.stop_name}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      activeOpacity={0.7}
                      onPress={() => setTimetableStop(null)}
                    >
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Frequency Info Banner */}
                  <View style={styles.freqBanner}>
                    <Text style={styles.freqBannerLabel}>Frequency Info:</Text>
                    <Text style={styles.freqBannerValue}>
                      Peak: 15 min · Off-Peak: 30 min
                    </Text>
                  </View>

                  {/* Scheduled Departures Grid */}
                  <View style={styles.timetableSection}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Star size={14} color="#B17816" />
                      <Text style={styles.timetableSectionTitle}>
                        SCHEDULED BUS DEPARTURES
                      </Text>
                    </View>

                    <ScrollView style={styles.scheduleScroll}>
                      <View style={styles.scheduleGrid}>
                        {scheduleTimes.map((item, idx) => {
                          const isLive = item.status === 'live';
                          const isPassed = item.status === 'completed';

                          return (
                            <View
                              key={'time-' + idx}
                              style={[
                                styles.scheduleItem,
                                isLive && styles.scheduleItemLive,
                                isPassed && styles.scheduleItemPassed,
                              ]}
                            >
                              <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Bus size={13} color={isLive ? '#B17816' : isPassed ? '#94A3B8' : '#64748B'} />
                                  <Text
                                    style={[
                                      styles.scheduleTimeText,
                                      isLive && styles.scheduleTimeTextLive,
                                      isPassed && styles.scheduleTimeTextPassed,
                                    ]}
                                  >
                                    {item.time}
                                  </Text>
                                </View>
                              </View>

                              {isLive ? (
                                <View style={styles.liveEtaPill}>
                                  <Text style={styles.liveEtaPillText}>
                                    ETA {item.liveEta}m
                                  </Text>
                                </View>
                              ) : isPassed ? (
                                <Text style={styles.passedText}>Passed</Text>
                              ) : (
                                <Text style={styles.schedText}>Scheduled</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Modal Footer */}
                  <TouchableOpacity
                    style={styles.modalDoneBtn}
                    activeOpacity={0.8}
                    onPress={() => setTimetableStop(null)}
                  >
                    <Text style={styles.modalDoneBtnText}>Close Timetable</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};
﻿const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginHorizontal: 12,
  },
  routeCodeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeCodeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  listContent: {
    paddingBottom: 96,
  },
  headerStack: {
    padding: 16,
    gap: 14,
  },
  mapContainer: {
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  mapLiveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
  },
  mapLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#F7A501',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: '#1C1400',
    fontWeight: '800',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  blockText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.text.secondary,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  busIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeHeaderInfo: {
    flex: 1,
  },
  routeNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  routeMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.muted,
    marginTop: 2,
  },
  densityCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  densityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  densityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  densityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  densityTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  densitySublabel: {
    fontSize: 10.5,
    fontWeight: '600',
    opacity: 0.8,
  },
  densityBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  densityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  densityScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
  },
  timelineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 2,
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineTotalStops: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  stopRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 14,
  },
  stopRowSelected: {
    backgroundColor: '#FEF3C7',
  },
  timelineColumn: {
    width: 28,
    alignItems: 'center',
    flexShrink: 0,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 12,
    backgroundColor: '#CBD5E1',
  },
  timelineLineHidden: {
    opacity: 0,
  },
  nodeWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  busNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.4)',
  },
  startNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  endNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#64748B',
  },
  regularNodeSelected: {
    borderColor: '#B17816',
    backgroundColor: '#F7A501',
    transform: [{ scale: 1.25 }],
  },
  stopContent: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  userNearestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  userNearestText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 22,
  },
  stopNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  stopNameTextSelected: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewScheduleLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B17816',
  },
  stopExpandedBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  stopExpandedLeft: {
    flex: 1,
  },
  stopArrivalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  stopSequenceText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: colors.text.muted,
    marginTop: 2,
  },
  timetableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 6,
  },
  timetableBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  loaderContainer: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalRoutePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalRoutePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  modalStopTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  freqBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  freqBannerValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B17816',
  },
  timetableSection: {
    gap: 8,
  },
  timetableSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
  scheduleScroll: {
    maxHeight: 200,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  scheduleItemLive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F7A501',
    borderWidth: 1.5,
  },
  scheduleItemPassed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.6,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  scheduleTimeTextLive: {
    fontWeight: '900',
    color: '#1C1400',
  },
  scheduleTimeTextPassed: {
    color: '#94A3B8',
  },
  liveEtaPill: {
    backgroundColor: '#F7A501',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveEtaPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1C1400',
  },
  passedText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  schedText: {
    fontSize: 10,
    color: colors.text.muted,
  },
  modalDoneBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
