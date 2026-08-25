import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Bus,
  Activity,
  Navigation,
  Clock,
  Compass,
  Gauge,
  Users,
  Wifi,
  WifiOff,
  Radio,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sliders,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
} from 'lucide-react-native';
import Svg, {
  Rect,
  Circle,
  Line,
  Polyline,
  Polygon,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  SIM_BASE_URL,
  S26_CORRIDOR_STOPS,
  colors,
  typography,
} from '@yara/shared';
import type {
  VehicleTelemetry,
  OccupancyBand,
  LegState,
} from '@yara/shared';
import { useAdmin } from '../context/AdminContext';
import { useNavigation } from '@react-navigation/native';
import type { AdminStackNavigationProp } from '../navigation/types';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Bounding box for Chennai S26 Corridor
const CORRIDOR_BOUNDS = {
  minLat: 13.028,
  maxLat: 13.044,
  minLon: 80.170,
  maxLon: 80.215,
};

// Fallback mock vehicles for offline/sim demo mode
const MOCK_VEHICLES: VehicleTelemetry[] = [
  {
    vehicle_id: 'BUS-001',
    block_id: 'block_001',
    trip_id: 'trip_001_out',
    route_id: 'S26',
    direction: 'outbound',
    leg_state: 'EN_ROUTE',
    timestamp: new Date().toISOString(),
    lat: 13.03267,
    lon: 80.20532,
    bearing_deg: 265,
    speed_kmh: 32.4,
    distance_covered_m: 1980,
    leg_total_distance_m: 3200,
    percent_leg_complete: 61.8,
    eta_leg_end_s: 340,
    dwell_remaining_s: null,
    hold_remaining_s: 0,
    schedule_deviation_s: 45,
    gnss_fix: true,
    gnss_dropout_remaining_s: 0,
    occupancy_band: 'SEATS_AVAILABLE',
    crowd_spike_active: false,
  },
  {
    vehicle_id: 'BUS-002',
    block_id: 'block_002',
    trip_id: 'trip_002_ret',
    route_id: 'S26',
    direction: 'inbound',
    leg_state: 'DWELL',
    timestamp: new Date().toISOString(),
    lat: 13.04104,
    lon: 80.17370,
    bearing_deg: 85,
    speed_kmh: 0.0,
    distance_covered_m: 3200,
    leg_total_distance_m: 3200,
    percent_leg_complete: 100.0,
    eta_leg_end_s: 0,
    dwell_remaining_s: 165,
    hold_remaining_s: 0,
    schedule_deviation_s: -30,
    gnss_fix: true,
    gnss_dropout_remaining_s: 0,
    occupancy_band: 'MODERATE',
    crowd_spike_active: false,
  },
  {
    vehicle_id: 'BUS-003',
    block_id: 'block_003',
    trip_id: 'trip_003_ret',
    route_id: 'S26',
    direction: 'inbound',
    leg_state: 'EN_ROUTE',
    timestamp: new Date().toISOString(),
    lat: 13.03157,
    lon: 80.19923,
    bearing_deg: 85,
    speed_kmh: 27.8,
    distance_covered_m: 1150,
    leg_total_distance_m: 3200,
    percent_leg_complete: 35.9,
    eta_leg_end_s: 520,
    dwell_remaining_s: null,
    hold_remaining_s: 0,
    schedule_deviation_s: 180,
    gnss_fix: false,
    gnss_dropout_remaining_s: 8,
    occupancy_band: 'STANDING_ROOM',
    crowd_spike_active: true,
  },
  {
    vehicle_id: 'BUS-004',
    block_id: 'block_004',
    trip_id: 'trip_004_out',
    route_id: 'S26',
    direction: 'outbound',
    leg_state: 'HOLD',
    timestamp: new Date().toISOString(),
    lat: 13.03514,
    lon: 80.21089,
    bearing_deg: 0,
    speed_kmh: 0.0,
    distance_covered_m: 0,
    leg_total_distance_m: 3200,
    percent_leg_complete: 0.0,
    eta_leg_end_s: 900,
    dwell_remaining_s: null,
    hold_remaining_s: 45,
    schedule_deviation_s: 0,
    gnss_fix: true,
    gnss_dropout_remaining_s: 0,
    occupancy_band: 'VERY_CROWDED',
    crowd_spike_active: false,
  },
];

// Helper: Project Geo coordinates (lat, lon) to SVG Canvas coordinates (x, y)
function projectGeoToSvg(
  lat: number,
  lon: number,
  svgWidth: number,
  svgHeight: number,
  padding = 24
): { x: number; y: number } {
  const clampedLat = Math.max(CORRIDOR_BOUNDS.minLat, Math.min(CORRIDOR_BOUNDS.maxLat, lat));
  const clampedLon = Math.max(CORRIDOR_BOUNDS.minLon, Math.min(CORRIDOR_BOUNDS.maxLon, lon));

  const lonSpan = CORRIDOR_BOUNDS.maxLon - CORRIDOR_BOUNDS.minLon;
  const latSpan = CORRIDOR_BOUNDS.maxLat - CORRIDOR_BOUNDS.minLat;

  const xNorm = (clampedLon - CORRIDOR_BOUNDS.minLon) / lonSpan;
  // Latitude increases upward; SVG Y increases downward
  const yNorm = (CORRIDOR_BOUNDS.maxLat - clampedLat) / latSpan;

  const innerW = svgWidth - padding * 2;
  const innerH = svgHeight - padding * 2;

  return {
    x: padding + xNorm * innerW,
    y: padding + yNorm * innerH,
  };
}

function formatMMSS(sec: number | null | undefined): string {
  if (sec == null || sec <= 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getHeadingName(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
}

function getLegStateStyle(state: LegState) {
  switch (state) {
    case 'EN_ROUTE':
      return {
        badgeBg: '#022C22',
        badgeBorder: '#059669',
        textColor: '#22C55E',
        dotColor: '#22C55E',
        label: 'EN ROUTE',
      };
    case 'DWELL':
      return {
        badgeBg: '#451A03',
        badgeBorder: '#D97706',
        textColor: '#F59E0B',
        dotColor: '#F59E0B',
        label: 'DWELLING',
      };
    case 'HOLD':
      return {
        badgeBg: '#450A0A',
        badgeBorder: '#DC2626',
        textColor: '#EF4444',
        dotColor: '#EF4444',
        label: 'HELD AT TERMINAL',
      };
  }
}

function getOccupancyStyle(band: string) {
  switch (band) {
    case 'SEATS_AVAILABLE':
      return {
        badgeBg: '#022C22',
        badgeBorder: '#059669',
        textColor: '#22C55E',
        label: 'Seats Available',
      };
    case 'MODERATE':
      return {
        badgeBg: '#451A03',
        badgeBorder: '#D97706',
        textColor: '#F59E0B',
        label: 'Moderate',
      };
    case 'STANDING_ROOM':
    case 'STANDING_ROOM_ONLY':
      return {
        badgeBg: '#431407',
        badgeBorder: '#EA580C',
        textColor: '#F97316',
        label: 'Standing Room',
      };
    case 'VERY_CROWDED':
      return {
        badgeBg: '#450A0A',
        badgeBorder: '#DC2626',
        textColor: '#EF4444',
        label: 'Very Crowded',
      };
    default:
      return {
        badgeBg: '#1E293B',
        badgeBorder: '#475569',
        textColor: '#94A3B8',
        label: band.replace('_', ' '),
      };
  }
}

interface LocalTimerRecord {
  dwell: number;
  hold: number;
  dropout: number;
  eta: number;
}

export const FleetScreen: React.FC = () => {
  const navigation = useNavigation<AdminStackNavigationProp>();
  const {
    vehicles: contextVehicles,
    setVehicles: setContextVehicles,
    selectedVehicleId,
    setSelectedVehicleId,
  } = useAdmin();

  // State
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>(
    contextVehicles.length > 0 ? contextVehicles : MOCK_VEHICLES
  );
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(selectedVehicleId ?? null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Local live ticking timers keyed by vehicle_id
  const [localTimers, setLocalTimers] = useState<Record<string, LocalTimerRecord>>({});

  // SVG mini-map width based on typical container
  const [svgDimensions, setSvgDimensions] = useState({ width: 340, height: 180 });

  // Sync activeVehicleId with context
  useEffect(() => {
    if (selectedVehicleId && selectedVehicleId !== activeVehicleId) {
      setActiveVehicleId(selectedVehicleId);
    }
  }, [selectedVehicleId, activeVehicleId]);

  // Fetch vehicles list from Simulator API
  const fetchVehicles = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${SIM_BASE_URL}/vehicles`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: VehicleTelemetry[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVehicles(data);
          setContextVehicles(data);
          setIsLive(true);
          setLastUpdated(new Date());
          return;
        }
      }
    } catch {
      // Offline fallback handling
    }

    // Keep current or set fallback
    setVehicles(prev => {
      if (prev.length === 0) {
        setContextVehicles(MOCK_VEHICLES);
        return MOCK_VEHICLES;
      }
      return prev;
    });
    setIsLive(false);
    setLastUpdated(new Date());
  }, [setContextVehicles]);

  // Initial fetch and 2000ms polling interval
  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 2000);
    return () => clearInterval(interval);
  }, [fetchVehicles]);

  // Synchronize local countdown timers whenever vehicle telemetry refreshes
  useEffect(() => {
    setLocalTimers(prev => {
      const next: Record<string, LocalTimerRecord> = { ...prev };
      vehicles.forEach(v => {
        next[v.vehicle_id] = {
          dwell: v.dwell_remaining_s ?? 0,
          hold: v.hold_remaining_s ?? 0,
          dropout: v.gnss_dropout_remaining_s ?? 0,
          eta: v.eta_leg_end_s ?? 0,
        };
      });
      return next;
    });
  }, [vehicles]);

  // 1-second live countdown ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setLocalTimers(prev => {
        const next: Record<string, LocalTimerRecord> = {};
        for (const [vid, t] of Object.entries(prev)) {
          next[vid] = {
            dwell: Math.max(0, t.dwell - 1),
            hold: Math.max(0, t.hold - 1),
            dropout: Math.max(0, t.dropout - 1),
            eta: Math.max(0, t.eta - 1),
          };
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveVehicleId(vehicleId);
    setSelectedVehicleId(vehicleId);
  };

  const handleBackToList = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveVehicleId(null);
  };

  const handleNavigateToInject = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    navigation.navigate('Inject');
  };

  // Currently selected vehicle data
  const selectedVehicle = useMemo(() => {
    if (!activeVehicleId) return null;
    return vehicles.find(v => v.vehicle_id === activeVehicleId) ?? vehicles[0];
  }, [activeVehicleId, vehicles]);

  // Active timers for selected vehicle
  const selectedTimers = useMemo(() => {
    if (!selectedVehicle) return { dwell: 0, hold: 0, dropout: 0, eta: 0 };
    return (
      localTimers[selectedVehicle.vehicle_id] ?? {
        dwell: selectedVehicle.dwell_remaining_s ?? 0,
        hold: selectedVehicle.hold_remaining_s ?? 0,
        dropout: selectedVehicle.gnss_dropout_remaining_s ?? 0,
        eta: selectedVehicle.eta_leg_end_s ?? 0,
      }
    );
  }, [selectedVehicle, localTimers]);

  // Format last updated time
  const formattedLastUpdated = useMemo(() => {
    const hh = lastUpdated.getHours().toString().padStart(2, '0');
    const mm = lastUpdated.getMinutes().toString().padStart(2, '0');
    const ss = lastUpdated.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [lastUpdated]);

  // Compute fleet KPI summaries
  const fleetKpis = useMemo(() => {
    const total = vehicles.length;
    const enRoute = vehicles.filter(v => v.leg_state === 'EN_ROUTE').length;
    const dwelling = vehicles.filter(v => v.leg_state === 'DWELL').length;
    const holding = vehicles.filter(v => v.leg_state === 'HOLD').length;
    const gnssFixed = vehicles.filter(v => v.gnss_fix).length;
    const avgSpeed =
      total > 0
        ? (vehicles.reduce((acc, v) => acc + v.speed_kmh, 0) / total).toFixed(1)
        : '0.0';

    return { total, enRoute, dwelling, holding, gnssFixed, avgSpeed };
  }, [vehicles]);

  // SVG Corridor polyline points string
  const corridorPoints = useMemo(() => {
    return S26_CORRIDOR_STOPS.map(stop => {
      const p = projectGeoToSvg(
        stop.lat,
        stop.lon,
        svgDimensions.width,
        svgDimensions.height,
        28
      );
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
  }, [svgDimensions]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
        {/* ── Screen Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FLEET TELEMETRY</Text>
            <Text style={styles.headerSubtitle}>
              Live Bus Telemetry & Diagnostics Matrix
            </Text>
          </View>
          <View style={styles.judgeBadge}>
            <ShieldCheck size={12} color="#F59E0B" />
            <Text style={styles.judgeBadgeText}>SIH 2026</Text>
          </View>
        </View>

        {/* ── Polling Status Bar ── */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                isLive ? styles.statusDotLive : styles.statusDotSim,
              ]}
            />
            <Text style={styles.statusText}>
              {isLive ? 'LIVE 1Hz POLL' : 'SIMULATION MODE'} • Updated {formattedLastUpdated} (2s interval)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchVehicles}
            disabled={loading}
            activeOpacity={0.7}
          >
            <RefreshCw size={12} color="#94A3B8" />
            <Text style={styles.refreshBtnText}>Poll</Text>
          </TouchableOpacity>
        </View>

        {/* ── View Switcher: List vs Drilldown ── */}
        {selectedVehicle ? (
          /* ════════════════════════════════════════════════════════════════
             DETAIL / DRILLDOWN VIEW FOR SELECTED VEHICLE
             ════════════════════════════════════════════════════════════════ */
          <View style={styles.detailContainer}>
            {/* Top Navigation Row in Detail View */}
            <View style={styles.detailNavRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBackToList}
                activeOpacity={0.7}
              >
                <ChevronLeft size={16} color="#F59E0B" />
                <Text style={styles.backBtnText}>Fleet Overview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.injectNavBtn}
                onPress={() => handleNavigateToInject(selectedVehicle.vehicle_id)}
                activeOpacity={0.7}
              >
                <Zap size={14} color="#0F172A" />
                <Text style={styles.injectNavBtnText}>Fault Inject</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Vehicle Switcher Pills */}
            <View style={styles.vehicleSwitcherRow}>
              {vehicles.map(v => {
                const isSelected = v.vehicle_id === selectedVehicle.vehicle_id;
                return (
                  <TouchableOpacity
                    key={v.vehicle_id}
                    style={[
                      styles.switcherPill,
                      isSelected && styles.switcherPillActive,
                    ]}
                    onPress={() => handleSelectVehicle(v.vehicle_id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.switcherPillText,
                        isSelected && styles.switcherPillTextActive,
                      ]}
                    >
                      {v.vehicle_id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Vehicle Hero Card */}
            <View style={styles.vehicleHeroCard}>
              <View style={styles.vehicleHeroTop}>
                <View style={styles.vehicleHeroLeft}>
                  <View style={styles.busHeroIcon}>
                    <Bus size={22} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.vehicleHeroTitle}>
                      {selectedVehicle.vehicle_id}
                    </Text>
                    <Text style={styles.vehicleHeroSubtitle}>
                      Route {selectedVehicle.route_id} • Block {selectedVehicle.block_id} • {selectedVehicle.direction.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Leg State Badge */}
                {(() => {
                  const stateStyle = getLegStateStyle(selectedVehicle.leg_state);
                  return (
                    <View
                      style={[
                        styles.legStateHeroBadge,
                        {
                          backgroundColor: stateStyle.badgeBg,
                          borderColor: stateStyle.badgeBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: stateStyle.dotColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.legStateHeroText,
                          { color: stateStyle.textColor },
                        ]}
                      >
                        {stateStyle.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Progress Bar in Hero */}
              <View style={styles.heroProgressSection}>
                <View style={styles.heroProgressLabelRow}>
                  <Text style={styles.heroProgressLabel}>
                    Trip Leg Progress ({selectedVehicle.direction})
                  </Text>
                  <Text style={styles.heroProgressValue}>
                    {selectedVehicle.percent_leg_complete.toFixed(1)}% • {selectedVehicle.distance_covered_m}m / {selectedVehicle.leg_total_distance_m}m
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, selectedVehicle.percent_leg_complete))}%`,
                        backgroundColor:
                          selectedVehicle.leg_state === 'DWELL'
                            ? '#F59E0B'
                            : selectedVehicle.leg_state === 'HOLD'
                            ? '#EF4444'
                            : '#2563EB',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* ── 1. Real-Time SVG Mini-Map ── */}
            <View
              style={styles.card}
              onLayout={e => {
                const w = e.nativeEvent.layout.width - 32;
                if (w > 100) {
                  setSvgDimensions({ width: w, height: 180 });
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <MapPin size={16} color="#F59E0B" />
                  <Text style={styles.cardTitle}>CORRIDOR POSITION MAP</Text>
                </View>
                <Text style={styles.mapCoordsText}>
                  {selectedVehicle.lat.toFixed(5)}, {selectedVehicle.lon.toFixed(5)}
                </Text>
              </View>

              <View style={styles.svgContainer}>
                <Svg
                  width={svgDimensions.width}
                  height={svgDimensions.height}
                  viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                >
                  <Defs>
                    <LinearGradient id="corridorGrad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                      <Stop offset="50%" stopColor="#3B82F6" stopOpacity="0.9" />
                      <Stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
                    </LinearGradient>
                  </Defs>

                  {/* Dark Grid Background */}
                  <Rect
                    x="0"
                    y="0"
                    width={svgDimensions.width}
                    height={svgDimensions.height}
                    fill="#0B1329"
                    rx="12"
                  />

                  {/* Grid Lines */}
                  <Line
                    x1="20"
                    y1={svgDimensions.height / 3}
                    x2={svgDimensions.width - 20}
                    y2={svgDimensions.height / 3}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <Line
                    x1="20"
                    y1={(svgDimensions.height / 3) * 2}
                    x2={svgDimensions.width - 20}
                    y2={(svgDimensions.height / 3) * 2}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <Line
                    x1={svgDimensions.width / 2}
                    y1="15"
                    x2={svgDimensions.width / 2}
                    y2={svgDimensions.height - 15}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* S26 Corridor Polyline */}
                  <Polyline
                    points={corridorPoints}
                    fill="none"
                    stroke="url(#corridorGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Stops Nodes */}
                  {S26_CORRIDOR_STOPS.map((stop, i) => {
                    const p = projectGeoToSvg(
                      stop.lat,
                      stop.lon,
                      svgDimensions.width,
                      svgDimensions.height,
                      28
                    );
                    const isTerminal = i === 0 || i === S26_CORRIDOR_STOPS.length - 1;
                    return (
                      <G key={stop.id}>
                        <Circle
                          cx={p.x}
                          cy={p.y}
                          r={isTerminal ? 4.5 : 2.5}
                          fill={isTerminal ? '#F59E0B' : '#64748B'}
                          stroke="#0F172A"
                          strokeWidth="1.5"
                        />
                      </G>
                    );
                  })}

                  {/* Terminal Labels */}
                  {(() => {
                    const first = projectGeoToSvg(
                      S26_CORRIDOR_STOPS[0].lat,
                      S26_CORRIDOR_STOPS[0].lon,
                      svgDimensions.width,
                      svgDimensions.height,
                      28
                    );
                    const last = projectGeoToSvg(
                      S26_CORRIDOR_STOPS[S26_CORRIDOR_STOPS.length - 1].lat,
                      S26_CORRIDOR_STOPS[S26_CORRIDOR_STOPS.length - 1].lon,
                      svgDimensions.width,
                      svgDimensions.height,
                      28
                    );
                    return (
                      <G>
                        <SvgText
                          x={first.x}
                          y={Math.min(svgDimensions.height - 6, first.y + 14)}
                          fill="#F59E0B"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Ashok Pillar
                        </SvgText>
                        <SvgText
                          x={last.x}
                          y={Math.max(12, last.y - 8)}
                          fill="#93C5FD"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Valasaravakkam
                        </SvgText>
                      </G>
                    );
                  })()}

                  {/* Real-time Bus Marker */}
                  {(() => {
                    const busPos = projectGeoToSvg(
                      selectedVehicle.lat,
                      selectedVehicle.lon,
                      svgDimensions.width,
                      svgDimensions.height,
                      28
                    );

                    const busColor =
                      selectedVehicle.gnss_fix === false
                        ? '#EF4444'
                        : selectedVehicle.leg_state === 'DWELL'
                        ? '#F59E0B'
                        : selectedVehicle.leg_state === 'HOLD'
                        ? '#EF4444'
                        : '#3B82F6';

                    return (
                      <G>
                        {/* Radar Aura Rings */}
                        <Circle
                          cx={busPos.x}
                          cy={busPos.y}
                          r="14"
                          fill={busColor}
                          fillOpacity="0.2"
                        />
                        <Circle
                          cx={busPos.x}
                          cy={busPos.y}
                          r="8"
                          fill={busColor}
                          fillOpacity="0.4"
                        />

                        {/* Bus Center Dot */}
                        <Circle
                          cx={busPos.x}
                          cy={busPos.y}
                          r="5.5"
                          fill={busColor}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />

                        {/* Directional Heading Cone / Arrow */}
                        <G
                          transform={`rotate(${selectedVehicle.bearing_deg}, ${busPos.x}, ${busPos.y})`}
                        >
                          <Polygon
                            points={`${busPos.x},${busPos.y - 12} ${busPos.x - 4},${busPos.y - 7} ${busPos.x + 4},${busPos.y - 7}`}
                            fill="#FFFFFF"
                          />
                        </G>

                        {/* Bus Badge Callout */}
                        <Rect
                          x={Math.max(4, Math.min(svgDimensions.width - 76, busPos.x - 36))}
                          y={Math.max(4, busPos.y - 28)}
                          width="72"
                          height="16"
                          rx="4"
                          fill="#0F172A"
                          stroke={busColor}
                          strokeWidth="1"
                        />
                        <SvgText
                          x={Math.max(40, Math.min(svgDimensions.width - 40, busPos.x))}
                          y={Math.max(16, busPos.y - 16)}
                          fill="#F8FAFC"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {selectedVehicle.vehicle_id} • {Math.round(selectedVehicle.speed_kmh)}k
                        </SvgText>
                      </G>
                    );
                  })()}
                </Svg>
              </View>

              <View style={styles.mapFooter}>
                <View style={styles.mapLegendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Route S26 Corridor</Text>
                </View>
                <View style={styles.mapLegendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>19 Geocoded Stops</Text>
                </View>
                <View style={styles.mapLegendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor:
                          selectedVehicle.gnss_fix !== false ? '#22C55E' : '#EF4444',
                      },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {selectedVehicle.gnss_fix !== false ? 'GNSS Fix' : 'Dropout'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── 2. Live Countdown Timers & State ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Clock size={16} color="#F59E0B" />
                  <Text style={styles.cardTitle}>LIVE COUNTDOWN TIMERS</Text>
                </View>
                <Text style={styles.cardSubtitle}>Compounding live state</Text>
              </View>

              <View style={styles.timersGrid}>
                {/* Dwell Recovery Timer */}
                <View
                  style={[
                    styles.timerCard,
                    selectedTimers.dwell > 0 && styles.timerCardActiveAmber,
                  ]}
                >
                  <View style={styles.timerTopRow}>
                    <Text style={styles.timerLabel}>DWELL RECOVERY</Text>
                    {selectedTimers.dwell > 0 ? (
                      <View style={styles.activePillAmber}>
                        <Text style={styles.activePillTextAmber}>DWELLING</Text>
                      </View>
                    ) : (
                      <Text style={styles.timerIdleText}>Idle</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timerValue,
                      selectedTimers.dwell > 0 && styles.timerValueAmber,
                    ]}
                  >
                    {formatMMSS(selectedTimers.dwell)}
                  </Text>
                  <Text style={styles.timerSubtext}>
                    {selectedTimers.dwell > 0
                      ? `${selectedTimers.dwell}s remaining (0.3 recovery)`
                      : 'Baseline halt buffer (300s nominal)'}
                  </Text>
                </View>

                {/* Hold Timer */}
                <View
                  style={[
                    styles.timerCard,
                    selectedTimers.hold > 0 && styles.timerCardActiveRed,
                  ]}
                >
                  <View style={styles.timerTopRow}>
                    <Text style={styles.timerLabel}>HOLD BUFFER</Text>
                    {selectedTimers.hold > 0 ? (
                      <View style={styles.activePillRed}>
                        <Text style={styles.activePillTextRed}>HOLD ACTIVE</Text>
                      </View>
                    ) : (
                      <Text style={styles.timerIdleText}>None</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timerValue,
                      selectedTimers.hold > 0 && styles.timerValueRed,
                    ]}
                  >
                    {formatMMSS(selectedTimers.hold)}
                  </Text>
                  <Text style={styles.timerSubtext}>
                    {selectedTimers.hold > 0
                      ? `${selectedTimers.hold}s terminal delay hold`
                      : 'Zero dispatch hold constraint'}
                  </Text>
                </View>

                {/* Leg End ETA Timer */}
                <View style={styles.timerCard}>
                  <View style={styles.timerTopRow}>
                    <Text style={styles.timerLabel}>LEG END ETA</Text>
                    <View style={styles.activePillBlue}>
                      <Text style={styles.activePillTextBlue}>ML EST</Text>
                    </View>
                  </View>
                  <Text style={[styles.timerValue, styles.timerValueBlue]}>
                    {formatMMSS(selectedTimers.eta)}
                  </Text>
                  <Text style={styles.timerSubtext}>
                    {selectedTimers.eta > 0
                      ? `~${Math.round(selectedTimers.eta / 60)}m to ${selectedVehicle.direction === 'outbound' ? 'Valasaravakkam' : 'Ashok Pillar'}`
                      : 'Leg completed'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── 3. GNSS Fix & Sensor Diagnostics ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {selectedVehicle.gnss_fix ? (
                    <Wifi size={16} color="#22C55E" />
                  ) : (
                    <WifiOff size={16} color="#EF4444" />
                  )}
                  <Text style={styles.cardTitle}>GNSS FIX & SENSOR STATUS</Text>
                </View>
                <View
                  style={[
                    styles.gnssStatusPill,
                    selectedVehicle.gnss_fix
                      ? styles.gnssStatusPillOk
                      : styles.gnssStatusPillDropout,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: selectedVehicle.gnss_fix
                          ? '#22C55E'
                          : '#EF4444',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.gnssStatusPillText,
                      selectedVehicle.gnss_fix
                        ? styles.gnssTextOk
                        : styles.gnssTextDropout,
                    ]}
                  >
                    {selectedVehicle.gnss_fix ? 'GNSS LOCK' : 'GPS DROPOUT'}
                  </Text>
                </View>
              </View>

              {/* GNSS Diagnostics Rows */}
              <View style={styles.diagBox}>
                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Satellite Fix Status</Text>
                  <Text
                    style={[
                      styles.diagValueBold,
                      {
                        color: selectedVehicle.gnss_fix ? '#22C55E' : '#EF4444',
                      },
                    ]}
                  >
                    {selectedVehicle.gnss_fix ? 'Active (Good HDOP)' : 'Lost Fix (Zero Satellites)'}
                  </Text>
                </View>

                {selectedTimers.dropout > 0 && (
                  <View style={[styles.diagRow, styles.diagRowHighlight]}>
                    <Text style={styles.diagLabelAlert}>Dropout Duration Remaining</Text>
                    <Text style={styles.diagValueAlert}>{selectedTimers.dropout}s</Text>
                  </View>
                )}

                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>State Estimation Source</Text>
                  <Text style={styles.diagValueMono}>
                    {selectedVehicle.gnss_fix
                      ? 'gnss (Live Hardware Fix)'
                      : 'kalman_estimated (Dead Reckoning)'}
                  </Text>
                </View>

                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Compass Heading / Bearing</Text>
                  <Text style={styles.diagValue}>
                    {selectedVehicle.bearing_deg}° ({getHeadingName(selectedVehicle.bearing_deg)})
                  </Text>
                </View>

                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Instantaneous Speed</Text>
                  <Text style={styles.diagValue}>
                    {selectedVehicle.speed_kmh.toFixed(1)} km/h
                  </Text>
                </View>
              </View>
            </View>

            {/* ── 4. Complete VehicleTelemetry Data Matrix ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Cpu size={16} color="#F59E0B" />
                  <Text style={styles.cardTitle}>COMPLETE TELEMETRY MATRIX</Text>
                </View>
                <Text style={styles.cardSubtitle}>All fields</Text>
              </View>

              {/* Group 1: Identity & Block */}
              <View style={styles.matrixGroup}>
                <Text style={styles.matrixGroupHeader}>IDENTIFICATION & BLOCK</Text>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>vehicle_id</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.vehicle_id}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>block_id</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.block_id}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>trip_id</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.trip_id}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>route_id</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.route_id}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>direction</Text>
                  <Text style={styles.matrixVal}>{selectedVehicle.direction}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>timestamp</Text>
                  <Text style={styles.matrixVal}>{selectedVehicle.timestamp}</Text>
                </View>
              </View>

              {/* Group 2: Kinematics & Progress */}
              <View style={styles.matrixGroup}>
                <Text style={styles.matrixGroupHeader}>KINEMATICS & PROGRESS</Text>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>speed_kmh</Text>
                  <Text style={styles.matrixValBold}>{selectedVehicle.speed_kmh.toFixed(1)} km/h</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>distance_covered_m</Text>
                  <Text style={styles.matrixVal}>{selectedVehicle.distance_covered_m} m</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>leg_total_distance_m</Text>
                  <Text style={styles.matrixVal}>{selectedVehicle.leg_total_distance_m} m</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>percent_leg_complete</Text>
                  <Text style={styles.matrixValHighlight}>{selectedVehicle.percent_leg_complete.toFixed(1)}%</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>schedule_deviation_s</Text>
                  <Text
                    style={[
                      styles.matrixVal,
                      {
                        color:
                          selectedVehicle.schedule_deviation_s > 0
                            ? '#EF4444'
                            : selectedVehicle.schedule_deviation_s < 0
                            ? '#22C55E'
                            : '#94A3B8',
                      },
                    ]}
                  >
                    {selectedVehicle.schedule_deviation_s > 0 ? `+${selectedVehicle.schedule_deviation_s}s` : `${selectedVehicle.schedule_deviation_s}s`}
                  </Text>
                </View>
              </View>

              {/* Group 3: State & Timing */}
              <View style={styles.matrixGroup}>
                <Text style={styles.matrixGroupHeader}>STATE & TIMERS</Text>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>leg_state</Text>
                  <Text style={styles.matrixValHighlight}>{selectedVehicle.leg_state}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>eta_leg_end_s</Text>
                  <Text style={styles.matrixValMono}>
                    {selectedVehicle.eta_leg_end_s != null ? `${selectedVehicle.eta_leg_end_s}s (${formatMMSS(selectedVehicle.eta_leg_end_s)})` : 'null'}
                  </Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>dwell_remaining_s</Text>
                  <Text style={styles.matrixValMono}>
                    {selectedTimers.dwell > 0 ? `${selectedTimers.dwell}s` : selectedVehicle.dwell_remaining_s != null ? `${selectedVehicle.dwell_remaining_s}s` : 'null'}
                  </Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>hold_remaining_s</Text>
                  <Text style={styles.matrixValMono}>{selectedTimers.hold}s</Text>
                </View>
              </View>

              {/* Group 4: Coordinates & Sensors */}
              <View style={styles.matrixGroup}>
                <Text style={styles.matrixGroupHeader}>GEOLOCATION & SENSORS</Text>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>lat</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.lat.toFixed(6)}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>lon</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.lon.toFixed(6)}</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>bearing_deg</Text>
                  <Text style={styles.matrixValMono}>{selectedVehicle.bearing_deg}°</Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>gnss_fix</Text>
                  <Text
                    style={[
                      styles.matrixValBold,
                      { color: selectedVehicle.gnss_fix ? '#22C55E' : '#EF4444' },
                    ]}
                  >
                    {String(selectedVehicle.gnss_fix)}
                  </Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>gnss_dropout_remaining_s</Text>
                  <Text style={styles.matrixValMono}>{selectedTimers.dropout}s</Text>
                </View>
              </View>

              {/* Group 5: Capacity & Occupancy */}
              <View style={styles.matrixGroup}>
                <Text style={styles.matrixGroupHeader}>CROWDING & OCCUPANCY</Text>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>occupancy_band</Text>
                  <Text
                    style={[
                      styles.matrixValBold,
                      { color: getOccupancyStyle(selectedVehicle.occupancy_band).textColor },
                    ]}
                  >
                    {selectedVehicle.occupancy_band}
                  </Text>
                </View>
                <View style={styles.matrixRow}>
                  <Text style={styles.matrixKey}>crowd_spike_active</Text>
                  <Text
                    style={[
                      styles.matrixValBold,
                      { color: selectedVehicle.crowd_spike_active ? '#EF4444' : '#94A3B8' },
                    ]}
                  >
                    {String(selectedVehicle.crowd_spike_active)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ════════════════════════════════════════════════════════════════
             MAIN FLEET OVERVIEW LIST (ALL 4 BUSES)
             ════════════════════════════════════════════════════════════════ */
          <View style={styles.listContainer}>
            {/* Fleet KPI Summary Header */}
            <View style={styles.kpiContainer}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{fleetKpis.total}</Text>
                <Text style={styles.kpiLabel}>FLEET UNITS</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: '#22C55E' }]}>
                  {fleetKpis.enRoute}
                </Text>
                <Text style={styles.kpiLabel}>EN ROUTE</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>
                  {fleetKpis.dwelling}
                </Text>
                <Text style={styles.kpiLabel}>DWELLING</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>
                  {fleetKpis.avgSpeed}
                </Text>
                <Text style={styles.kpiLabel}>AVG KM/H</Text>
              </View>
            </View>

            {/* Vehicle List Cards */}
            <View style={styles.cardList}>
              {vehicles.map(vehicle => {
                const stateStyle = getLegStateStyle(vehicle.leg_state);
                const occStyle = getOccupancyStyle(vehicle.occupancy_band);
                const vehicleTimers = localTimers[vehicle.vehicle_id] ?? {
                  dwell: vehicle.dwell_remaining_s ?? 0,
                  hold: vehicle.hold_remaining_s ?? 0,
                  dropout: vehicle.gnss_dropout_remaining_s ?? 0,
                  eta: vehicle.eta_leg_end_s ?? 0,
                };

                return (
                  <TouchableOpacity
                    key={vehicle.vehicle_id}
                    style={styles.vehicleCard}
                    onPress={() => handleSelectVehicle(vehicle.vehicle_id)}
                    activeOpacity={0.8}
                  >
                    {/* Top Row: Vehicle ID & Leg State Badge */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardIdGroup}>
                        <View style={styles.busIconBadge}>
                          <Bus size={18} color="#F59E0B" />
                        </View>
                        <View>
                          <View style={styles.vehicleIdRow}>
                            <Text style={styles.vehicleIdText}>
                              {vehicle.vehicle_id}
                            </Text>
                            <View style={styles.routeTag}>
                              <Text style={styles.routeTagText}>
                                {vehicle.route_id} • {vehicle.direction}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.blockText}>
                            Block: {vehicle.block_id} • Trip: {vehicle.trip_id}
                          </Text>
                        </View>
                      </View>

                      {/* Leg State Badge */}
                      <View
                        style={[
                          styles.legStateBadge,
                          {
                            backgroundColor: stateStyle.badgeBg,
                            borderColor: stateStyle.badgeBorder,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: stateStyle.dotColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.legStateText,
                            { color: stateStyle.textColor },
                          ]}
                        >
                          {stateStyle.label}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Metrics Row */}
                    <View style={styles.metricsRow}>
                      {/* Speed */}
                      <View style={styles.metricItem}>
                        <View style={styles.metricLabelRow}>
                          <Gauge size={12} color="#94A3B8" />
                          <Text style={styles.metricLabel}>Speed</Text>
                        </View>
                        <Text style={styles.metricValue}>
                          {vehicle.speed_kmh.toFixed(1)}{' '}
                          <Text style={styles.metricUnit}>km/h</Text>
                        </Text>
                      </View>

                      {/* Occupancy Band */}
                      <View style={styles.metricItem}>
                        <View style={styles.metricLabelRow}>
                          <Users size={12} color="#94A3B8" />
                          <Text style={styles.metricLabel}>Occupancy</Text>
                        </View>
                        <View
                          style={[
                            styles.occMiniBadge,
                            {
                              backgroundColor: occStyle.badgeBg,
                              borderColor: occStyle.badgeBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.occMiniText,
                              { color: occStyle.textColor },
                            ]}
                            numberOfLines={1}
                          >
                            {occStyle.label}
                          </Text>
                        </View>
                      </View>

                      {/* GNSS Status */}
                      <View style={styles.metricItem}>
                        <View style={styles.metricLabelRow}>
                          {vehicle.gnss_fix ? (
                            <Wifi size={12} color="#22C55E" />
                          ) : (
                            <WifiOff size={12} color="#EF4444" />
                          )}
                          <Text style={styles.metricLabel}>GNSS</Text>
                        </View>
                        <Text
                          style={[
                            styles.gnssStatusText,
                            { color: vehicle.gnss_fix ? '#22C55E' : '#EF4444' },
                          ]}
                        >
                          {vehicle.gnss_fix
                            ? 'Fix OK'
                            : `Dropout (${vehicleTimers.dropout}s)`}
                        </Text>
                      </View>
                    </View>

                    {/* Active Timer Pill if in Dwell or Hold */}
                    {(vehicleTimers.dwell > 0 || vehicleTimers.hold > 0) && (
                      <View style={styles.activeTimerBanner}>
                        {vehicleTimers.dwell > 0 && (
                          <View style={styles.timerBannerItemAmber}>
                            <Clock size={12} color="#F59E0B" />
                            <Text style={styles.timerBannerTextAmber}>
                              Dwell Countdown: {formatMMSS(vehicleTimers.dwell)}
                            </Text>
                          </View>
                        )}
                        {vehicleTimers.hold > 0 && (
                          <View style={styles.timerBannerItemRed}>
                            <AlertCircle size={12} color="#EF4444" />
                            <Text style={styles.timerBannerTextRed}>
                              Hold Buffer: {formatMMSS(vehicleTimers.hold)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Progress Bar Row */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressText}>
                          Progress: {vehicle.percent_leg_complete.toFixed(1)}%
                        </Text>
                        <Text style={styles.distanceText}>
                          {vehicle.distance_covered_m}m / {vehicle.leg_total_distance_m}m
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(100, Math.max(0, vehicle.percent_leg_complete))}%`,
                              backgroundColor:
                                vehicle.leg_state === 'DWELL'
                                  ? '#F59E0B'
                                  : vehicle.leg_state === 'HOLD'
                                  ? '#EF4444'
                                  : '#2563EB',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Card Footer: Tap for Telemetry & Mini-Map */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardFooterText}>
                        Tap for Real-Time Mini-Map & Telemetry Matrix
                      </Text>
                      <ChevronRight size={14} color="#F59E0B" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Screen Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            YARA Intelligence Engine • Fleet Telemetry & GTFS Pipeline • SIH 2026
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark canvas matching InjectScreen
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  judgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  judgeBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Polling Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotLive: {
    backgroundColor: '#22C55E',
  },
  statusDotSim: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
    flex: 1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshBtnText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },

  // KPI Row
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    fontFamily: typography.fontFamily.mono,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // List Container
  listContainer: {
    gap: 12,
  },
  cardList: {
    gap: 12,
  },

  // Vehicle Card (Overview)
  vehicleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  busIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleIdText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    fontFamily: typography.fontFamily.mono,
  },
  routeTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  routeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  blockText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  legStateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  legStateText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: typography.fontFamily.mono,
  },
  metricUnit: {
    fontSize: 10,
    color: '#94A3B8',
  },
  occMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  occMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gnssStatusText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.fontFamily.mono,
  },

  // Active Timer Banner
  activeTimerBanner: {
    flexDirection: 'row',
    gap: 8,
  },
  timerBannerItemAmber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A03',
    borderColor: '#D97706',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  timerBannerTextAmber: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
  },
  timerBannerItemRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  timerBannerTextRed: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
  },

  // Progress Bar
  progressContainer: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: typography.fontFamily.mono,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 2,
  },
  cardFooterText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },

  // ════════════════════════════════════════════════════════════════
  // DETAIL VIEW STYLES
  // ════════════════════════════════════════════════════════════════
  detailContainer: {
    gap: 14,
  },
  detailNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  injectNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  injectNavBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },

  // Quick Switcher Pills
  vehicleSwitcherRow: {
    flexDirection: 'row',
    gap: 8,
  },
  switcherPill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  switcherPillActive: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  switcherPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    fontFamily: typography.fontFamily.mono,
  },
  switcherPillTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },

  // Hero Card
  vehicleHeroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    gap: 12,
  },
  vehicleHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  busHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    fontFamily: typography.fontFamily.mono,
  },
  vehicleHeroSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  legStateHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  legStateHeroText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroProgressSection: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  heroProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProgressLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  heroProgressValue: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
  },

  // Base Card
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mapCoordsText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: '#94A3B8',
  },

  // SVG Mini-Map
  svgContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#0B1329',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Timers Grid
  timersGrid: {
    gap: 8,
  },
  timerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 4,
  },
  timerCardActiveAmber: {
    borderColor: '#D97706',
    backgroundColor: '#2D1B06',
  },
  timerCardActiveRed: {
    borderColor: '#DC2626',
    backgroundColor: '#2B0D0D',
  },
  timerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  timerIdleText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  activePillAmber: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillTextAmber: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '900',
  },
  activePillRed: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillTextRed: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  activePillBlue: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillTextBlue: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '900',
  },
  timerValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    fontFamily: typography.fontFamily.mono,
  },
  timerValueAmber: {
    color: '#F59E0B',
  },
  timerValueRed: {
    color: '#EF4444',
  },
  timerValueBlue: {
    color: '#60A5FA',
  },
  timerSubtext: {
    fontSize: 10,
    color: '#94A3B8',
  },

  // GNSS Diagnostics Card
  gnssStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  gnssStatusPillOk: {
    backgroundColor: '#022C22',
    borderColor: '#059669',
  },
  gnssStatusPillDropout: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
  },
  gnssStatusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gnssTextOk: {
    color: '#22C55E',
  },
  gnssTextDropout: {
    color: '#EF4444',
  },
  diagBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 8,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagRowHighlight: {
    backgroundColor: '#450A0A',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  diagLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  diagLabelAlert: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '800',
  },
  diagValue: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  diagValueBold: {
    fontSize: 11,
    fontWeight: '900',
  },
  diagValueAlert: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EF4444',
    fontFamily: typography.fontFamily.mono,
  },
  diagValueMono: {
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: '#CBD5E1',
    fontWeight: '600',
  },

  // Telemetry Matrix Groups
  matrixGroup: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  matrixGroupHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 4,
  },
  matrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixKey: {
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: '#94A3B8',
  },
  matrixVal: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  matrixValMono: {
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  matrixValBold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  matrixValHighlight: {
    fontSize: 11,
    fontWeight: '900',
    color: '#22C55E',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: typography.fontFamily.mono,
    textAlign: 'center',
  },
});

