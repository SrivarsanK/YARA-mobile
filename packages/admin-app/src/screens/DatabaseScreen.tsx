import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Database,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Code,
  Layers,
  MapPin,
  Cpu,
  Activity,
  Bus,
  ShieldCheck,
  Zap,
  Sliders,
  TrendingUp,
  Clock,
  ArrowRight,
  X,
  FileText,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react-native';
import {
  API_BASE_URL,
  colors,
  typography,
} from '@yara/shared';
import type {
  NeonRoute,
  NeonStop,
  BusArrival,
  TransitSnapshot,
  OccupancyBand,
} from '@yara/shared';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & CONTRACTS (Zero `any`)
// ══════════════════════════════════════════════════════════════════════════════

type DatabaseTab = 'routes' | 'stops' | 'live_state' | 'model_info' | 'network_stats';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface RoutePaginationResponse {
  routes: NeonRoute[];
  total: number;
  page: number;
  totalPages: number;
}

interface StopNearbyItem {
  stop: NeonStop;
  distance_m: number;
  arrivals: BusArrival[];
}

interface ModelInfoData {
  model_name: string;
  model_version: string;
  algorithm: string;
  framework: string;
  status: string;
  last_trained: string;
  training_samples: number;
  features_count: number;
  metrics: {
    mae_seconds: number;
    rmse_seconds: number;
    r2_score: number;
    mape_percent: number;
    median_abs_error: number;
  };
  feature_importances: {
    feature: string;
    importance: number;
    description: string;
  }[];
  hyperparameters: Record<string, string | number | boolean>;
}

interface NetworkStatsData {
  agency_name: string;
  total_routes: number;
  total_stops: number;
  total_trips: number;
  active_blocks: number;
  corridor_length_km: number;
  avg_headway_min: number;
  peak_bus_requirement: number;
  fleet_occupancy_avg: string;
  on_time_performance_pct: number;
  gtfs_feed_version: string;
  last_sync_timestamp: string;
  database_type: string;
  spatial_index_status: string;
  busy_corridors: {
    name: string;
    route_code: string;
    frequency_per_hr: number;
    ridership_daily: string;
  }[];
}

interface ToastState {
  id: string;
  msg: string;
  type: 'success' | 'info' | 'error';
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK FALLBACK DATA (For offline / disconnected dev mode)
// ══════════════════════════════════════════════════════════════════════════════

const MOCK_ROUTES: NeonRoute[] = [
  {
    route_id: 'S26_0',
    route_short_name: 'S26',
    route_long_name: 'Ashok Pillar - Valasaravakkam (Outbound)',
    route_type: 3,
    direction_id: 0,
    stop_count: 19,
    duration_sec: 1500,
    fare_inr: 15,
  },
  {
    route_id: 'S26_1',
    route_short_name: 'S26',
    route_long_name: 'Valasaravakkam - Ashok Pillar (Return)',
    route_type: 3,
    direction_id: 1,
    stop_count: 19,
    duration_sec: 1500,
    fare_inr: 15,
  },
  {
    route_id: '23C_0',
    route_short_name: '23C',
    route_long_name: 'Besant Nagar - Ayanavaram B.S.',
    route_type: 3,
    direction_id: 0,
    stop_count: 28,
    duration_sec: 2700,
    fare_inr: 22,
  },
  {
    route_id: '102_0',
    route_short_name: '102',
    route_long_name: 'Broadway - Kelambakkam OMR Corridor',
    route_type: 3,
    direction_id: 0,
    stop_count: 42,
    duration_sec: 3900,
    fare_inr: 35,
  },
  {
    route_id: '570_0',
    route_short_name: '570',
    route_long_name: 'Koyambedu CMBT - Siruseri SIPCOT Express',
    route_type: 3,
    direction_id: 0,
    stop_count: 36,
    duration_sec: 3400,
    fare_inr: 30,
  },
  {
    route_id: '21G_0',
    route_short_name: '21G',
    route_long_name: 'Broadway - Tambaram East via Guindy',
    route_type: 3,
    direction_id: 0,
    stop_count: 34,
    duration_sec: 3600,
    fare_inr: 28,
  },
  {
    route_id: '114_0',
    route_short_name: '114',
    route_long_name: 'Red Hills - V.Nagar Terminus',
    route_type: 3,
    direction_id: 0,
    stop_count: 24,
    duration_sec: 2100,
    fare_inr: 18,
  },
  {
    route_id: '47A_0',
    route_short_name: '47A',
    route_long_name: 'ICF - Thiruvanmiyur via T.Nagar',
    route_type: 3,
    direction_id: 0,
    stop_count: 31,
    duration_sec: 3000,
    fare_inr: 25,
  },
];

const MOCK_STOPS: NeonStop[] = [
  { stop_id: 'S1', stop_name: 'Ashok Pillar', stop_lat: 13.03514, stop_lon: 80.21089, stop_sequence: 1 },
  { stop_id: 'S2', stop_name: 'Ashok Pillar (Jaffarkhanpet)', stop_lat: 13.03354, stop_lon: 80.21209, stop_sequence: 2 },
  { stop_id: 'S4', stop_name: 'Bharathidasan Colony', stop_lat: 13.03267, stop_lon: 80.20532, stop_sequence: 4 },
  { stop_id: 'S7', stop_name: 'Saravana Electrical', stop_lat: 13.03157, stop_lon: 80.19923, stop_sequence: 7 },
  { stop_id: 'S11', stop_name: 'Nesapakkam MGR Statue', stop_lat: 13.03152, stop_lon: 80.19123, stop_sequence: 11 },
  { stop_id: 'S14', stop_name: 'Ramapuram Ashram', stop_lat: 13.03175, stop_lon: 80.18395, stop_sequence: 14 },
  { stop_id: 'S17', stop_name: 'Ambedkar Salai - Ramapuram', stop_lat: 13.03611, stop_lon: 80.17505, stop_sequence: 17 },
  { stop_id: 'S19', stop_name: 'Valasaravakkam', stop_lat: 13.04104, stop_lon: 80.17370, stop_sequence: 19 },
  { stop_id: 'S101', stop_name: 'Guindy TVK Estate', stop_lat: 13.0067, stop_lon: 80.2023, stop_sequence: 1 },
  { stop_id: 'S102', stop_name: 'T.Nagar Bus Terminus', stop_lat: 13.0401, stop_lon: 80.2337, stop_sequence: 1 },
  { stop_id: 'S103', stop_name: 'Broadway Bus Terminus', stop_lat: 13.0882, stop_lon: 80.2838, stop_sequence: 1 },
];

const MOCK_ARRIVALS: BusArrival[] = [
  {
    route_id: 'S26_0',
    route_code: 'S26',
    route_name: 'Valasaravakkam',
    vehicle_id: 'BUS-001',
    eta_seconds: 245,
    occupancy_band: 'SEATS_AVAILABLE',
    direction: 'outbound',
  },
  {
    route_id: 'S26_1',
    route_code: 'S26',
    route_name: 'Ashok Pillar',
    vehicle_id: 'BUS-002',
    eta_seconds: 520,
    occupancy_band: 'MODERATE',
    direction: 'inbound',
  },
  {
    route_id: '47A_0',
    route_code: '47A',
    route_name: 'Thiruvanmiyur',
    vehicle_id: 'BUS-004',
    eta_seconds: 810,
    occupancy_band: 'STANDING_ROOM',
    direction: 'outbound',
  },
];

const MOCK_LIVE_SNAPSHOT: TransitSnapshot = {
  ts: Date.now() / 1000,
  vehicle: {
    lat: 13.03267,
    lon: 80.20532,
    leg: 'inbound',
    progress: 0.618,
    source: 'kalman_estimated',
    trip_id: 'trip_001_ret',
    block_id: 'block_001',
  },
  outbound: {
    T_outbound_sec: 1500,
  },
  inbound: {
    trip_id: 'trip_001_ret',
    T_total_sec: 720,
    T_outbound_sec: 0,
    T_dwell_sec: 120,
    T_inbound_sec: 600,
    occupancy_band: 'SEATS_AVAILABLE',
  },
  event_log: [
    { ts: '09:35:12', event: 'Kalman 1D filter update (lat: 13.03267, lon: 80.20532)', delta_sec: 0 },
    { ts: '09:34:45', event: 'Dwell recovery applied (-60s buffer adjustment)', delta_sec: -60 },
    { ts: '09:32:00', event: 'Departed terminal Valasaravakkam on inbound leg', delta_sec: 0 },
    { ts: '09:28:10', event: 'Outbound trip completed, entered dwell state', delta_sec: 0 },
  ],
};

const MOCK_MODEL_INFO: ModelInfoData = {
  model_name: 'YARA-GBDT-Kalman-ETA',
  model_version: '2.4.1-sih2026',
  algorithm: 'LightGBM Regressor + Kalman State Fusion',
  framework: 'Python 3.11 / LightGBM 4.3 / NumPy / SciPy',
  status: 'ONLINE & SERVING',
  last_trained: '2026-08-20T14:30:00Z',
  training_samples: 48250,
  features_count: 14,
  metrics: {
    mae_seconds: 24.3,
    rmse_seconds: 38.6,
    r2_score: 0.942,
    mape_percent: 4.8,
    median_abs_error: 18.2,
  },
  feature_importances: [
    { feature: 'distance_to_dest_m', importance: 0.342, description: 'Spatial corridor distance remaining' },
    { feature: 'kalman_rolling_speed_kmh', importance: 0.238, description: '1D Kalman filtered velocity estimation' },
    { feature: 'dwell_buffer_sec', importance: 0.175, description: 'Compounding scheduled dwell recovery' },
    { feature: 'time_of_day_cos_sin', importance: 0.134, description: 'Cyclic rush-hour traffic modeling' },
    { feature: 'occupancy_crowd_factor', importance: 0.111, description: 'Passenger boarding delay multiplier' },
  ],
  hyperparameters: {
    learning_rate: 0.05,
    num_leaves: 31,
    max_depth: 7,
    n_estimators: 300,
    subsample: 0.8,
    colsample_bytree: 0.85,
    min_child_samples: 20,
  },
};

const MOCK_NETWORK_STATS: NetworkStatsData = {
  agency_name: 'Metropolitan Transport Corporation (MTC Chennai)',
  total_routes: 624,
  total_stops: 3842,
  total_trips: 14200,
  active_blocks: 48,
  corridor_length_km: 1420.5,
  avg_headway_min: 8.5,
  peak_bus_requirement: 3250,
  fleet_occupancy_avg: 'MODERATE (68%)',
  on_time_performance_pct: 91.4,
  gtfs_feed_version: 'MTC-GTFS-2026-Q3-V4',
  last_sync_timestamp: new Date().toISOString(),
  database_type: 'Neon Serverless Postgres 16 (PostGIS 3.4)',
  spatial_index_status: 'GIST(geometry) Active & Clustered',
  busy_corridors: [
    { name: 'Ashok Pillar - Valasaravakkam Corridor', route_code: 'S26', frequency_per_hr: 12, ridership_daily: '18,400' },
    { name: 'OMR IT Highway Express', route_code: '102 / 570', frequency_per_hr: 16, ridership_daily: '42,000' },
    { name: 'Anna Salai Trunk Line', route_code: '21G / 18A', frequency_per_hr: 20, ridership_daily: '58,200' },
    { name: 'GST Road South Corridor', route_code: '70V / 114', frequency_per_hr: 10, ridership_daily: '24,600' },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// CLIPBOARD HELPER WITH SAFE CROSS-PLATFORM FALLBACK
// ══════════════════════════════════════════════════════════════════════════════

async function copyStringToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RECURSIVE EXPANDABLE JSON TREE INSPECTOR (ZERO `any`)
// ══════════════════════════════════════════════════════════════════════════════

interface JsonTreeNodeProps {
  keyName?: string;
  value: unknown;
  depth: number;
  isLast?: boolean;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  currentPath: string;
  onCopy: (text: string) => void;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  keyName,
  value,
  depth,
  isLast = true,
  expandedPaths,
  togglePath,
  currentPath,
  onCopy,
}) => {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isExpanded = expandedPaths.has(currentPath);

  const indentStyle = { paddingLeft: depth * 14 };

  if (isObject) {
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>);

    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';
    const countLabel = isArray
      ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`
      : `${entries.length} ${entries.length === 1 ? 'key' : 'keys'}`;

    return (
      <View style={styles.jsonRowContainer}>
        <TouchableOpacity
          style={[styles.jsonNodeRow, indentStyle]}
          onPress={() => togglePath(currentPath)}
          activeOpacity={0.7}
        >
          <View style={styles.caretContainer}>
            {isExpanded ? (
              <ChevronDown size={12} color="#94A3B8" />
            ) : (
              <ChevronRight size={12} color="#94A3B8" />
            )}
          </View>

          {keyName !== undefined && (
            <Text style={styles.jsonKey}>
              {isArray ? `[${keyName}]` : `"${keyName}"`}:
            </Text>
          )}

          <Text style={styles.jsonBracket}>{openBracket}</Text>

          {!isExpanded && (
            <Text style={styles.jsonCollapsedSummary}>
              {' '}{countLabel}{' '}
            </Text>
          )}

          {!isExpanded && (
            <Text style={styles.jsonBracket}>
              {closeBracket}{isLast ? '' : ','}
            </Text>
          )}

          <TouchableOpacity
            style={styles.nodeCopyBtn}
            onPress={(e) => {
              e.stopPropagation();
              onCopy(JSON.stringify(value, null, 2));
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Copy size={10} color="#64748B" />
          </TouchableOpacity>
        </TouchableOpacity>

        {isExpanded && (
          <View>
            {entries.map(([childKey, childValue], index) => {
              const childPath = `${currentPath}.${childKey}`;
              const isChildLast = index === entries.length - 1;
              return (
                <JsonTreeNode
                  key={childKey}
                  keyName={isArray ? undefined : childKey}
                  value={childValue}
                  depth={depth + 1}
                  isLast={isChildLast}
                  expandedPaths={expandedPaths}
                  togglePath={togglePath}
                  currentPath={childPath}
                  onCopy={onCopy}
                />
              );
            })}
            <View style={[styles.jsonNodeRow, indentStyle]}>
              <Text style={styles.jsonBracket}>
                {closeBracket}{isLast ? '' : ','}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Primitive Value Render
  let formattedValueNode: React.ReactNode;
  let rawCopyString = String(value);

  if (value === null) {
    formattedValueNode = <Text style={styles.jsonNull}>null</Text>;
    rawCopyString = 'null';
  } else if (value === undefined) {
    formattedValueNode = <Text style={styles.jsonUndefined}>undefined</Text>;
    rawCopyString = 'undefined';
  } else if (typeof value === 'string') {
    formattedValueNode = <Text style={styles.jsonString}>"{value}"</Text>;
    rawCopyString = value;
  } else if (typeof value === 'number') {
    formattedValueNode = <Text style={styles.jsonNumber}>{value}</Text>;
    rawCopyString = String(value);
  } else if (typeof value === 'boolean') {
    formattedValueNode = <Text style={styles.jsonBoolean}>{value ? 'true' : 'false'}</Text>;
    rawCopyString = value ? 'true' : 'false';
  } else {
    formattedValueNode = <Text style={styles.jsonDefault}>{String(value)}</Text>;
  }

  return (
    <View style={[styles.jsonNodeRow, indentStyle]}>
      <View style={styles.caretPlaceholder} />
      {keyName !== undefined && (
        <Text style={styles.jsonKey}>"{keyName}": </Text>
      )}
      {formattedValueNode}
      <Text style={styles.jsonBracket}>{isLast ? '' : ','}</Text>

      <TouchableOpacity
        style={styles.leafCopyBtn}
        onPress={() => onCopy(rawCopyString)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Copy size={9} color="#475569" />
      </TouchableOpacity>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DATABASE SCREEN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const DatabaseScreen: React.FC = () => {
  // Navigation & Active Tab state
  const [activeTab, setActiveTab] = useState<DatabaseTab>('routes');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Global Toast Feedback
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Math.random().toString(36), msg, type });
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 90,
      friction: 10,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 2200);
  }, [toastAnim]);

  const handleCopy = useCallback(async (text: string, label = 'Value') => {
    const success = await copyStringToClipboard(text);
    if (success) {
      showToast(`${label} copied to clipboard`, 'success');
    } else {
      showToast('Failed to copy', 'error');
    }
  }, [showToast]);

  // ────────────────────────────────────────────────────────────────────────────
  // TAB 1: ROUTES STATE & ACTIONS
  // ────────────────────────────────────────────────────────────────────────────
  const [routesData, setRoutesData] = useState<NeonRoute[]>(MOCK_ROUTES);
  const [routesTotal, setRoutesTotal] = useState<number>(MOCK_ROUTES.length);
  const [routesPage, setRoutesPage] = useState<number>(1);
  const [routesTotalPages, setRoutesTotalPages] = useState<number>(1);
  const [routesLoading, setRoutesLoading] = useState<boolean>(false);
  const [routesSearchQuery, setRoutesSearchQuery] = useState<string>('');
  const [isSearchingRoutes, setIsSearchingRoutes] = useState<boolean>(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [routesSourceLive, setRoutesSourceLive] = useState<boolean>(false);

  const fetchRoutes = useCallback(async (page = 1, query = '') => {
    setRoutesLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
      if (query.trim()) {
        const url = `${API_BASE_URL}/api/routes/search?q=${encodeURIComponent(query.trim())}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data: unknown = await res.json();
          if (Array.isArray(data)) {
            setRoutesData(data as NeonRoute[]);
            setRoutesTotal(data.length);
            setRoutesPage(1);
            setRoutesTotalPages(1);
            setRoutesSourceLive(true);
            setIsSearchingRoutes(true);
            return;
          } else if (data && typeof data === 'object' && 'routes' in (data as Record<string, unknown>)) {
            const list = (data as { routes: NeonRoute[] }).routes;
            setRoutesData(list);
            setRoutesTotal(list.length);
            setRoutesPage(1);
            setRoutesTotalPages(1);
            setRoutesSourceLive(true);
            setIsSearchingRoutes(true);
            return;
          }
        }
      } else {
        const url = `${API_BASE_URL}/api/routes?page=${page}&limit=50`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = (await res.json()) as RoutePaginationResponse;
          if (data && Array.isArray(data.routes)) {
            setRoutesData(data.routes);
            setRoutesTotal(data.total ?? data.routes.length);
            setRoutesPage(data.page ?? page);
            setRoutesTotalPages(data.totalPages ?? 1);
            setRoutesSourceLive(true);
            setIsSearchingRoutes(false);
            return;
          }
        }
      }
    } catch {
      // Offline fallback
    } finally {
      clearTimeout(timer);
      setRoutesLoading(false);
    }

    // Fallback filter
    setRoutesSourceLive(false);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const filtered = MOCK_ROUTES.filter(
        r => r.route_short_name.toLowerCase().includes(q) || r.route_long_name.toLowerCase().includes(q)
      );
      setRoutesData(filtered);
      setRoutesTotal(filtered.length);
      setRoutesPage(1);
      setRoutesTotalPages(1);
      setIsSearchingRoutes(true);
    } else {
      setRoutesData(MOCK_ROUTES);
      setRoutesTotal(MOCK_ROUTES.length);
      setRoutesPage(1);
      setRoutesTotalPages(1);
      setIsSearchingRoutes(false);
    }
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // TAB 2: STOPS STATE & ACTIONS
  // ────────────────────────────────────────────────────────────────────────────
  const [stopsSearchQuery, setStopsSearchQuery] = useState<string>('Ashok');
  const [stopsList, setStopsList] = useState<NeonStop[]>(MOCK_STOPS.slice(0, 5));
  const [selectedStop, setSelectedStop] = useState<NeonStop | null>(MOCK_STOPS[0]);
  const [nearbyArrivals, setNearbyArrivals] = useState<BusArrival[]>(MOCK_ARRIVALS);
  const [stopsLoading, setStopsLoading] = useState<boolean>(false);
  const [nearbyLoading, setNearbyLoading] = useState<boolean>(false);
  const [stopsSourceLive, setStopsSourceLive] = useState<boolean>(false);

  const fetchStops = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setStopsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
      const url = `${API_BASE_URL}/api/stops/search?q=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data: unknown = await res.json();
        if (Array.isArray(data)) {
          setStopsList(data as NeonStop[]);
          setStopsSourceLive(true);
          if (data.length > 0) {
            handleSelectStop(data[0] as NeonStop);
          }
          return;
        }
      }
    } catch {
      // Offline fallback
    } finally {
      clearTimeout(timer);
      setStopsLoading(false);
    }

    // Fallback search
    setStopsSourceLive(false);
    const q = query.toLowerCase();
    const filtered = MOCK_STOPS.filter(
      s => s.stop_name.toLowerCase().includes(q) || s.stop_id.toLowerCase().includes(q)
    );
    setStopsList(filtered.length > 0 ? filtered : MOCK_STOPS);
    if (filtered.length > 0) {
      handleSelectStop(filtered[0]);
    }
  }, []);

  const handleSelectStop = useCallback(async (stop: NeonStop) => {
    setSelectedStop(stop);
    setNearbyLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
      const url = `${API_BASE_URL}/api/stops/nearby?lat=${stop.stop_lat}&lon=${stop.stop_lon}&limit=5`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data: unknown = await res.json();
        if (Array.isArray(data)) {
          const items = data as StopNearbyItem[];
          if (items.length > 0 && Array.isArray(items[0].arrivals)) {
            setNearbyArrivals(items[0].arrivals);
            return;
          }
        }
      }
    } catch {
      // Offline fallback
    } finally {
      clearTimeout(timer);
      setNearbyLoading(false);
    }

    // Fallback nearby arrivals
    setNearbyArrivals(MOCK_ARRIVALS);
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // TAB 3: LIVE STATE (GET /eta) STATE & ACTIONS
  // ────────────────────────────────────────────────────────────────────────────
  const [liveSnapshot, setLiveSnapshot] = useState<TransitSnapshot>(MOCK_LIVE_SNAPSHOT);
  const [liveSnapshotLoading, setLiveSnapshotLoading] = useState<boolean>(false);
  const [liveSnapshotTime, setLiveSnapshotTime] = useState<Date>(new Date());
  const [liveSourceLive, setLiveSourceLive] = useState<boolean>(false);

  const fetchLiveSnapshot = useCallback(async () => {
    setLiveSnapshotLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${API_BASE_URL}/eta`, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = (await res.json()) as TransitSnapshot;
        if (data && data.vehicle && data.inbound) {
          setLiveSnapshot(data);
          setLiveSnapshotTime(new Date());
          setLiveSourceLive(true);
          showToast('Live ETA snapshot fetched', 'success');
          return;
        }
      }
    } catch {
      // Offline fallback
    } finally {
      clearTimeout(timer);
      setLiveSnapshotLoading(false);
    }

    // Fallback
    setLiveSnapshot({
      ...MOCK_LIVE_SNAPSHOT,
      ts: Date.now() / 1000,
    });
    setLiveSnapshotTime(new Date());
    setLiveSourceLive(false);
  }, [showToast]);

  // ────────────────────────────────────────────────────────────────────────────
  // TAB 4: MODEL INFO (GET /model/info) STATE & ACTIONS
  // ────────────────────────────────────────────────────────────────────────────
  const [modelInfo, setModelInfo] = useState<ModelInfoData>(MOCK_MODEL_INFO);
  const [modelInfoLoading, setModelInfoLoading] = useState<boolean>(false);
  const [modelInfoLive, setModelInfoLive] = useState<boolean>(false);

  const fetchModelInfo = useCallback(async () => {
    setModelInfoLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${API_BASE_URL}/model/info`, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = (await res.json()) as ModelInfoData;
        if (data && data.metrics) {
          setModelInfo(data);
          setModelInfoLive(true);
          return;
        }
      }
    } catch {
      // Offline fallback
    } finally {
      clearTimeout(timer);
      setModelInfoLoading(false);
    }

    setModelInfo(MOCK_MODEL_INFO);
    setModelInfoLive(false);
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // TAB 5: NETWORK STATS (GET /routes) STATE & ACTIONS
  // ────────────────────────────────────────────────────────────────────────────
  const [networkStats, setNetworkStats] = useState<NetworkStatsData>(MOCK_NETWORK_STATS);
  const [networkStatsLoading, setNetworkStatsLoading] = useState<boolean>(false);
  const [networkStatsLive, setNetworkStatsLive] = useState<boolean>(false);

  const fetchNetworkStats = useCallback(async () => {
    setNetworkStatsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${API_BASE_URL}/routes`, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data: unknown = await res.json();
        if (data && typeof data === 'object' && 'total_routes' in (data as Record<string, unknown>)) {
          setNetworkStats(data as NetworkStatsData);
          setNetworkStatsLive(true);
          return;
        }
      }
    } catch {
      // Offline fallback
    } finally {
      clearTimeout(timer);
      setNetworkStatsLoading(false);
    }

    setNetworkStats(MOCK_NETWORK_STATS);
    setNetworkStatsLive(false);
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // LAZY LOADING ON TAB VISIT
  // ────────────────────────────────────────────────────────────────────────────
  const loadedTabsRef = useRef<Set<DatabaseTab>>(new Set());

  useEffect(() => {
    if (!loadedTabsRef.current.has(activeTab)) {
      loadedTabsRef.current.add(activeTab);
      switch (activeTab) {
        case 'routes':
          fetchRoutes(1, '');
          break;
        case 'stops':
          fetchStops(stopsSearchQuery);
          break;
        case 'live_state':
          fetchLiveSnapshot();
          break;
        case 'model_info':
          fetchModelInfo();
          break;
        case 'network_stats':
          fetchNetworkStats();
          break;
      }
    }
  }, [activeTab, fetchRoutes, fetchStops, stopsSearchQuery, fetchLiveSnapshot, fetchModelInfo, fetchNetworkStats]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    switch (activeTab) {
      case 'routes':
        await fetchRoutes(routesPage, routesSearchQuery);
        break;
      case 'stops':
        await fetchStops(stopsSearchQuery);
        break;
      case 'live_state':
        await fetchLiveSnapshot();
        break;
      case 'model_info':
        await fetchModelInfo();
        break;
      case 'network_stats':
        await fetchNetworkStats();
        break;
    }
    setRefreshing(false);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // JSON TREE INSPECTOR EXPANSION STATE
  // ────────────────────────────────────────────────────────────────────────────
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    return new Set(['root', 'root.vehicle', 'root.inbound', 'root.outbound', 'root.event_log', 'root.metrics']);
  });

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAllPaths = useCallback((obj: unknown, prefix = 'root') => {
    const paths = new Set<string>();
    function traverse(val: unknown, current: string) {
      if (val !== null && typeof val === 'object') {
        paths.add(current);
        if (Array.isArray(val)) {
          val.forEach((item, idx) => traverse(item, `${current}.${idx}`));
        } else {
          Object.entries(val as Record<string, unknown>).forEach(([k, v]) => {
            traverse(v, `${current}.${k}`);
          });
        }
      }
    }
    traverse(obj, prefix);
    setExpandedPaths(paths);
  }, []);

  const collapseAllPaths = useCallback(() => {
    setExpandedPaths(new Set(['root']));
  }, []);

  // Compute active payload for Raw JSON view
  const currentTabRawJsonString = useMemo(() => {
    switch (activeTab) {
      case 'routes':
        return JSON.stringify({ routes: routesData, total: routesTotal, page: routesPage, totalPages: routesTotalPages }, null, 2);
      case 'stops':
        return JSON.stringify({ search_query: stopsSearchQuery, selected_stop: selectedStop, nearby_arrivals: nearbyArrivals, search_results: stopsList }, null, 2);
      case 'live_state':
        return JSON.stringify(liveSnapshot, null, 2);
      case 'model_info':
        return JSON.stringify(modelInfo, null, 2);
      case 'network_stats':
        return JSON.stringify(networkStats, null, 2);
    }
  }, [activeTab, routesData, routesTotal, routesPage, routesTotalPages, stopsSearchQuery, selectedStop, nearbyArrivals, stopsList, liveSnapshot, modelInfo, networkStats]);

  // Tab live status flag
  const isCurrentTabLive = useMemo(() => {
    switch (activeTab) {
      case 'routes': return routesSourceLive;
      case 'stops': return stopsSourceLive;
      case 'live_state': return liveSourceLive;
      case 'model_info': return modelInfoLive;
      case 'network_stats': return networkStatsLive;
    }
  }, [activeTab, routesSourceLive, stopsSourceLive, liveSourceLive, modelInfoLive, networkStatsLive]);

  // Format MM:SS helper
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getOccupancyColor = (band: string) => {
    switch (band) {
      case 'SEATS_AVAILABLE': return '#22C55E';
      case 'MODERATE': return '#EAB308';
      case 'STANDING_ROOM':
      case 'STANDING_ROOM_ONLY': return '#F97316';
      case 'VERY_CROWDED': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER UI
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <View style={styles.screen}>
      {/* ── Toast Notification Banner ── */}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.toast,
              toast.type === 'success' && styles.toastSuccess,
              toast.type === 'error' && styles.toastError,
              toast.type === 'info' && styles.toastInfo,
            ]}
          >
            {toast.type === 'success' && <CheckCircle2 size={15} color="#22C55E" />}
            {toast.type === 'error' && <AlertCircle size={15} color="#EF4444" />}
            {toast.type === 'info' && <Zap size={15} color="#F59E0B" />}
            <Text style={styles.toastText} numberOfLines={2}>
              {toast.msg}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── Screen Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBox}>
            <Database size={18} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.headerTitle}>NEON DB INSPECTOR</Text>
            <Text style={styles.headerSubtitle}>
              CH-3 Transit Data Contracts & GTFS Explorer
            </Text>
          </View>
        </View>

        <View style={styles.headerRightControls}>
          {/* SIH Judge Badge */}
          <View style={styles.judgeBadge}>
            <ShieldCheck size={11} color="#F59E0B" />
            <Text style={styles.judgeBadgeText}>NEON PG</Text>
          </View>

          {/* Raw JSON View Switcher */}
          <TouchableOpacity
            style={[styles.rawToggleBtn, showRawJson && styles.rawToggleBtnActive]}
            onPress={() => setShowRawJson(!showRawJson)}
            activeOpacity={0.7}
          >
            <Code size={13} color={showRawJson ? '#0F172A' : '#F59E0B'} />
            <Text style={[styles.rawToggleText, showRawJson && styles.rawToggleTextActive]}>
              {showRawJson ? 'Formatted' : 'Raw JSON'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Endpoint Status & Channel Bar ── */}
      <View style={styles.endpointStatusBar}>
        <View style={styles.endpointStatusLeft}>
          <View
            style={[
              styles.endpointDot,
              isCurrentTabLive ? styles.endpointDotLive : styles.endpointDotSim,
            ]}
          />
          <Text style={styles.endpointStatusText}>
            {isCurrentTabLive ? 'LIVE NEON DB (CH-3)' : 'LOCAL DATA STORE'} • {API_BASE_URL}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.copyUrlBtn}
          onPress={() => handleCopy(API_BASE_URL, 'API Base URL')}
          activeOpacity={0.7}
        >
          <Copy size={11} color="#94A3B8" />
          <Text style={styles.copyUrlText}>Copy Base URL</Text>
        </TouchableOpacity>
      </View>

      {/* ── 5 Tab Navigation Bar ── */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {/* Tab 1: Routes */}
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'routes' && styles.tabBtnActive]}
            onPress={() => setActiveTab('routes')}
            activeOpacity={0.7}
          >
            <Bus size={14} color={activeTab === 'routes' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'routes' && styles.tabBtnTextActive]}>
              Routes
            </Text>
            {routesTotal > 0 && (
              <View style={[styles.tabCountPill, activeTab === 'routes' && styles.tabCountPillActive]}>
                <Text style={[styles.tabCountText, activeTab === 'routes' && styles.tabCountTextActive]}>
                  {routesTotal}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Tab 2: Stops */}
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'stops' && styles.tabBtnActive]}
            onPress={() => setActiveTab('stops')}
            activeOpacity={0.7}
          >
            <MapPin size={14} color={activeTab === 'stops' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'stops' && styles.tabBtnTextActive]}>
              Stops
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Live State */}
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'live_state' && styles.tabBtnActive]}
            onPress={() => setActiveTab('live_state')}
            activeOpacity={0.7}
          >
            <Activity size={14} color={activeTab === 'live_state' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'live_state' && styles.tabBtnTextActive]}>
              Live State
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Model Info */}
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'model_info' && styles.tabBtnActive]}
            onPress={() => setActiveTab('model_info')}
            activeOpacity={0.7}
          >
            <Cpu size={14} color={activeTab === 'model_info' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'model_info' && styles.tabBtnTextActive]}>
              Model Info
            </Text>
          </TouchableOpacity>

          {/* Tab 5: Network Stats */}
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'network_stats' && styles.tabBtnActive]}
            onPress={() => setActiveTab('network_stats')}
            activeOpacity={0.7}
          >
            <BarChart2 size={14} color={activeTab === 'network_stats' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.tabBtnText, activeTab === 'network_stats' && styles.tabBtnTextActive]}>
              Network
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Tab Content Area ── */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
        {/* ══════════════════════════════════════════════════════════════════════
            GLOBAL RAW JSON VIEW (When Raw JSON toggle is ON)
            ══════════════════════════════════════════════════════════════════════ */}
        {showRawJson ? (
          <View style={styles.rawJsonCard}>
            <View style={styles.rawJsonHeader}>
              <View style={styles.rawJsonHeaderLeft}>
                <Code size={16} color="#38BDF8" />
                <Text style={styles.rawJsonTitle}>RAW PAYLOAD ({activeTab.toUpperCase()})</Text>
              </View>
              <TouchableOpacity
                style={styles.rawCopyBtn}
                onPress={() => handleCopy(currentTabRawJsonString, 'Raw JSON Payload')}
                activeOpacity={0.7}
              >
                <Copy size={13} color="#0F172A" />
                <Text style={styles.rawCopyBtnText}>Copy JSON</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rawCodeBlock}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.rawCodeText} selectable>
                  {currentTabRawJsonString}
                </Text>
              </ScrollView>
            </View>
          </View>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
             FORMATTED TAB VIEWS
             ══════════════════════════════════════════════════════════════════════ */
          <>
            {/* ────────────────────────────────────────────────────────────────
                TAB 1: ROUTES
                ──────────────────────────────────────────────────────────────── */}
            {activeTab === 'routes' && (
              <View style={styles.tabSection}>
                {/* Search & Total Header Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Bus size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>GTFS ROUTES REGISTRY</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      {routesTotal} routes total • Page {routesPage}/{routesTotalPages}
                    </Text>
                  </View>

                  {/* Search Input Box */}
                  <View style={styles.searchBarRow}>
                    <View style={styles.searchBox}>
                      <Search size={15} color="#94A3B8" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search route code (e.g. S26, 23C, 102)..."
                        placeholderTextColor="#64748B"
                        value={routesSearchQuery}
                        onChangeText={setRoutesSearchQuery}
                        onSubmitEditing={() => fetchRoutes(1, routesSearchQuery)}
                        returnKeyType="search"
                        autoCapitalize="none"
                      />
                      {routesSearchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setRoutesSearchQuery('');
                            fetchRoutes(1, '');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.searchBtn}
                      onPress={() => fetchRoutes(1, routesSearchQuery)}
                      disabled={routesLoading}
                      activeOpacity={0.7}
                    >
                      {routesLoading ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <Text style={styles.searchBtnText}>Search</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Quick Filter Chips */}
                  <View style={styles.chipsRow}>
                    {['All', 'S26', '23C', '102', '570', '21G'].map(chip => (
                      <TouchableOpacity
                        key={chip}
                        style={[
                          styles.filterChip,
                          (chip === 'All' && !routesSearchQuery) || routesSearchQuery.toUpperCase() === chip
                            ? styles.filterChipActive
                            : null,
                        ]}
                        onPress={() => {
                          const query = chip === 'All' ? '' : chip;
                          setRoutesSearchQuery(query);
                          fetchRoutes(1, query);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            (chip === 'All' && !routesSearchQuery) || routesSearchQuery.toUpperCase() === chip
                              ? styles.filterChipTextActive
                              : null,
                          ]}
                        >
                          {chip}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Routes List */}
                {routesLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                    <Text style={styles.loadingText}>Fetching routes from Neon DB...</Text>
                  </View>
                ) : routesData.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <AlertCircle size={28} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Routes Found</Text>
                    <Text style={styles.emptySubtitle}>No matching routes found for "{routesSearchQuery}"</Text>
                    <TouchableOpacity
                      style={styles.emptyActionBtn}
                      onPress={() => {
                        setRoutesSearchQuery('');
                        fetchRoutes(1, '');
                      }}
                    >
                      <Text style={styles.emptyActionText}>Reset Search</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.routesListContainer}>
                    {routesData.map(route => {
                      const isExpanded = expandedRouteId === route.route_id;
                      const durationMin = Math.round(route.duration_sec / 60);

                      return (
                        <View key={route.route_id} style={styles.routeCard}>
                          {/* Top Row: Route Badge + Name */}
                          <TouchableOpacity
                            style={styles.routeCardHeader}
                            onPress={() => setExpandedRouteId(isExpanded ? null : route.route_id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.routeCodePill}>
                              <Text style={styles.routeCodeText}>{route.route_short_name}</Text>
                            </View>

                            <View style={styles.routeMainInfo}>
                              <Text style={styles.routeLongName} numberOfLines={2}>
                                {route.route_long_name}
                              </Text>
                              <Text style={styles.routeIdLabel}>ID: {route.route_id}</Text>
                            </View>

                            <View style={styles.expandChevron}>
                              {isExpanded ? (
                                <ChevronDown size={18} color="#94A3B8" />
                              ) : (
                                <ChevronRight size={18} color="#94A3B8" />
                              )}
                            </View>
                          </TouchableOpacity>

                          {/* Stats Badges Row */}
                          <View style={styles.routeStatsRow}>
                            <View style={styles.routeStatBadge}>
                              <Text style={styles.routeStatLabel}>DIR:</Text>
                              <Text style={styles.routeStatValue}>
                                {route.direction_id === 0 ? 'Outbound (0)' : 'Return (1)'}
                              </Text>
                            </View>
                            <View style={styles.routeStatBadge}>
                              <Text style={styles.routeStatLabel}>STOPS:</Text>
                              <Text style={styles.routeStatValue}>{route.stop_count}</Text>
                            </View>
                            <View style={styles.routeStatBadge}>
                              <Text style={styles.routeStatLabel}>TIME:</Text>
                              <Text style={styles.routeStatValue}>{durationMin} min</Text>
                            </View>
                            {route.fare_inr !== undefined && (
                              <View style={styles.routeStatBadge}>
                                <Text style={styles.routeStatLabel}>FARE:</Text>
                                <Text style={styles.routeStatValue}>₹{route.fare_inr}</Text>
                              </View>
                            )}
                          </View>

                          {/* Expanded JSON Inspector for this Route */}
                          {isExpanded && (
                            <View style={styles.routeExpandedSection}>
                              <View style={styles.routeExpandedHeader}>
                                <Text style={styles.routeExpandedTitle}>ROUTE JSON CONTRACT</Text>
                                <View style={styles.routeExpandedActions}>
                                  <TouchableOpacity
                                    style={styles.miniCopyBtn}
                                    onPress={() => handleCopy(route.route_id, 'Route ID')}
                                  >
                                    <Text style={styles.miniCopyBtnText}>Copy ID</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.miniCopyBtn}
                                    onPress={() => handleCopy(JSON.stringify(route, null, 2), 'Route JSON')}
                                  >
                                    <Copy size={11} color="#38BDF8" />
                                    <Text style={styles.miniCopyBtnText}>Copy JSON</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              <View style={styles.inlineTreeBox}>
                                <JsonTreeNode
                                  value={route}
                                  depth={0}
                                  expandedPaths={expandedPaths}
                                  togglePath={togglePath}
                                  currentPath={`route.${route.route_id}`}
                                  onCopy={(t) => handleCopy(t, 'Value')}
                                />
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* Pagination Controls */}
                    {!isSearchingRoutes && routesTotalPages > 1 && (
                      <View style={styles.paginationRow}>
                        <TouchableOpacity
                          style={[styles.pageBtn, routesPage <= 1 && styles.pageBtnDisabled]}
                          onPress={() => fetchRoutes(routesPage - 1, routesSearchQuery)}
                          disabled={routesPage <= 1 || routesLoading}
                        >
                          <ChevronLeft size={16} color={routesPage <= 1 ? '#475569' : '#F8FAFC'} />
                          <Text style={[styles.pageBtnText, routesPage <= 1 && styles.pageBtnTextDisabled]}>
                            Prev
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.pageIndicatorText}>
                          Page {routesPage} of {routesTotalPages}
                        </Text>

                        <TouchableOpacity
                          style={[styles.pageBtn, routesPage >= routesTotalPages && styles.pageBtnDisabled]}
                          onPress={() => fetchRoutes(routesPage + 1, routesSearchQuery)}
                          disabled={routesPage >= routesTotalPages || routesLoading}
                        >
                          <Text style={[styles.pageBtnText, routesPage >= routesTotalPages && styles.pageBtnTextDisabled]}>
                            Next
                          </Text>
                          <ChevronRight size={16} color={routesPage >= routesTotalPages ? '#475569' : '#F8FAFC'} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ────────────────────────────────────────────────────────────────
                TAB 2: STOPS
                ──────────────────────────────────────────────────────────────── */}
            {activeTab === 'stops' && (
              <View style={styles.tabSection}>
                {/* Search Stops Header Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <MapPin size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>GEOCODED STOPS & ARRIVALS</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>Neon PostGIS Spatial Lookup</Text>
                  </View>

                  {/* Stop Search Input */}
                  <View style={styles.searchBarRow}>
                    <View style={styles.searchBox}>
                      <Search size={15} color="#94A3B8" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search stop name (e.g. Ashok Pillar, Guindy)..."
                        placeholderTextColor="#64748B"
                        value={stopsSearchQuery}
                        onChangeText={setStopsSearchQuery}
                        onSubmitEditing={() => fetchStops(stopsSearchQuery)}
                        returnKeyType="search"
                        autoCapitalize="none"
                      />
                      {stopsSearchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setStopsSearchQuery('');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.searchBtn}
                      onPress={() => fetchStops(stopsSearchQuery)}
                      disabled={stopsLoading}
                      activeOpacity={0.7}
                    >
                      {stopsLoading ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <Text style={styles.searchBtnText}>Search</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Preset Stops Chips */}
                  <View style={styles.chipsRow}>
                    {['Ashok', 'Nesapakkam', 'Valasaravakkam', 'Guindy', 'Broadway'].map(preset => (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.filterChip,
                          stopsSearchQuery.toLowerCase().includes(preset.toLowerCase()) && styles.filterChipActive,
                        ]}
                        onPress={() => {
                          setStopsSearchQuery(preset);
                          fetchStops(preset);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            stopsSearchQuery.toLowerCase().includes(preset.toLowerCase()) && styles.filterChipTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Selected Stop Details & Live Arrivals */}
                {selectedStop && (
                  <View style={styles.selectedStopCard}>
                    <View style={styles.selectedStopTop}>
                      <View style={styles.selectedStopIconBox}>
                        <MapPin size={20} color="#F59E0B" />
                      </View>
                      <View style={styles.selectedStopHeaderInfo}>
                        <Text style={styles.selectedStopName}>{selectedStop.stop_name}</Text>
                        <Text style={styles.selectedStopCoords}>
                          ID: {selectedStop.stop_id} • Lat: {selectedStop.stop_lat.toFixed(5)}, Lon: {selectedStop.stop_lon.toFixed(5)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.stopCoordsCopyBtn}
                        onPress={() => handleCopy(`${selectedStop.stop_lat},${selectedStop.stop_lon}`, 'Coordinates')}
                      >
                        <Copy size={12} color="#38BDF8" />
                      </TouchableOpacity>
                    </View>

                    {/* Nearby Buses Title */}
                    <View style={styles.nearbyHeaderRow}>
                      <View style={styles.nearbyTitleLeft}>
                        <Bus size={14} color="#38BDF8" />
                        <Text style={styles.nearbySectionTitle}>
                          UPCOMING ARRIVALS (/api/stops/nearby)
                        </Text>
                      </View>
                      {nearbyLoading && <ActivityIndicator size="small" color="#38BDF8" />}
                    </View>

                    {/* Arrivals List */}
                    {nearbyArrivals.length === 0 ? (
                      <Text style={styles.noArrivalsText}>No buses currently en route to this stop</Text>
                    ) : (
                      <View style={styles.arrivalsList}>
                        {nearbyArrivals.map((arr, idx) => {
                          const occColor = getOccupancyColor(arr.occupancy_band);
                          return (
                            <View key={`${arr.vehicle_id}-${idx}`} style={styles.arrivalCard}>
                              <View style={styles.arrivalLeft}>
                                <View style={styles.arrivalCodeBadge}>
                                  <Text style={styles.arrivalCodeText}>{arr.route_code}</Text>
                                </View>
                                <View>
                                  <Text style={styles.arrivalRouteName}>{arr.route_name}</Text>
                                  <Text style={styles.arrivalVehicleId}>
                                    Unit {arr.vehicle_id} • {arr.direction.toUpperCase()}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.arrivalRight}>
                                <View style={styles.arrivalEtaBox}>
                                  <Clock size={11} color="#F59E0B" />
                                  <Text style={styles.arrivalEtaText}>{formatSeconds(arr.eta_seconds)}</Text>
                                </View>
                                <View style={[styles.arrivalOccBadge, { borderColor: occColor }]}>
                                  <View style={[styles.occDot, { backgroundColor: occColor }]} />
                                  <Text style={[styles.arrivalOccText, { color: occColor }]}>
                                    {arr.occupancy_band.replace('_', ' ')}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Copy Stop JSON Button */}
                    <TouchableOpacity
                      style={styles.copyStopPayloadBtn}
                      onPress={() => handleCopy(JSON.stringify({ stop: selectedStop, arrivals: nearbyArrivals }, null, 2), 'Stop JSON')}
                    >
                      <Copy size={12} color="#0F172A" />
                      <Text style={styles.copyStopPayloadText}>Copy Full Stop & Arrivals JSON</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Stop Search Results List */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>SEARCH RESULTS ({stopsList.length})</Text>
                    <Text style={styles.cardSubtitle}>Tap stop to inspect arrivals</Text>
                  </View>

                  <View style={styles.stopsResultList}>
                    {stopsList.map(stop => {
                      const isSelected = selectedStop?.stop_id === stop.stop_id;
                      return (
                        <TouchableOpacity
                          key={stop.stop_id}
                          style={[styles.stopItemRow, isSelected && styles.stopItemRowSelected]}
                          onPress={() => handleSelectStop(stop)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.stopItemLeft}>
                            <MapPin size={15} color={isSelected ? '#F59E0B' : '#64748B'} />
                            <View style={styles.stopItemTexts}>
                              <Text style={[styles.stopItemName, isSelected && styles.stopItemNameSelected]}>
                                {stop.stop_name}
                              </Text>
                              <Text style={styles.stopItemId}>
                                ID: {stop.stop_id} • ({stop.stop_lat.toFixed(4)}, {stop.stop_lon.toFixed(4)})
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={16} color={isSelected ? '#F59E0B' : '#475569'} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ────────────────────────────────────────────────────────────────
                TAB 3: LIVE STATE (GET /eta JSON TREE INSPECTOR)
                ──────────────────────────────────────────────────────────────── */}
            {activeTab === 'live_state' && (
              <View style={styles.tabSection}>
                {/* Live State Controls & KPI Banner */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Activity size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>GET /eta TRANSIT SNAPSHOT</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.refreshSnapshotBtn}
                      onPress={fetchLiveSnapshot}
                      disabled={liveSnapshotLoading}
                    >
                      {liveSnapshotLoading ? (
                        <ActivityIndicator size="small" color="#F59E0B" />
                      ) : (
                        <>
                          <RefreshCw size={12} color="#F59E0B" />
                          <Text style={styles.refreshSnapshotText}>Fetch Latest</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Snapshot Quick Metrics Grid */}
                  <View style={styles.snapshotMetricsGrid}>
                    <View style={styles.snapshotMetricCard}>
                      <Text style={styles.snapshotMetricLabel}>Active Unit</Text>
                      <Text style={styles.snapshotMetricValue}>{liveSnapshot.vehicle?.block_id ?? 'block_001'}</Text>
                    </View>
                    <View style={styles.snapshotMetricCard}>
                      <Text style={styles.snapshotMetricLabel}>Leg State</Text>
                      <Text style={[styles.snapshotMetricValue, { color: '#22C55E' }]}>
                        {liveSnapshot.vehicle?.leg?.toUpperCase() ?? 'INBOUND'}
                      </Text>
                    </View>
                    <View style={styles.snapshotMetricCard}>
                      <Text style={styles.snapshotMetricLabel}>Total Inbound ETA</Text>
                      <Text style={[styles.snapshotMetricValue, { color: '#F59E0B' }]}>
                        {formatSeconds(liveSnapshot.inbound?.T_total_sec ?? 720)}
                      </Text>
                    </View>
                    <View style={styles.snapshotMetricCard}>
                      <Text style={styles.snapshotMetricLabel}>GNSS Source</Text>
                      <Text style={[styles.snapshotMetricValue, { color: '#38BDF8' }]}>
                        {liveSnapshot.vehicle?.source?.toUpperCase() ?? 'KALMAN'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Expandable JSON Tree Inspector */}
                <View style={styles.jsonTreeCard}>
                  <View style={styles.jsonTreeToolbar}>
                    <View style={styles.jsonTreeToolbarLeft}>
                      <Code size={15} color="#38BDF8" />
                      <Text style={styles.jsonTreeTitle}>INTERACTIVE JSON TREE</Text>
                    </View>

                    <View style={styles.jsonTreeToolbarActions}>
                      <TouchableOpacity
                        style={styles.treeActionBtn}
                        onPress={() => expandAllPaths(liveSnapshot)}
                      >
                        <Text style={styles.treeActionBtnText}>Expand All</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.treeActionBtn}
                        onPress={collapseAllPaths}
                      >
                        <Text style={styles.treeActionBtnText}>Collapse</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.treeCopyBtn}
                        onPress={() => handleCopy(JSON.stringify(liveSnapshot, null, 2), 'Snapshot JSON')}
                      >
                        <Copy size={11} color="#0F172A" />
                        <Text style={styles.treeCopyBtnText}>Copy JSON</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Render Root JSON Node */}
                  <View style={styles.jsonTreeBody}>
                    <JsonTreeNode
                      keyName="TransitSnapshot"
                      value={liveSnapshot}
                      depth={0}
                      expandedPaths={expandedPaths}
                      togglePath={togglePath}
                      currentPath="root"
                      onCopy={(t) => handleCopy(t, 'Value')}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ────────────────────────────────────────────────────────────────
                TAB 4: MODEL INFO (GET /model/info)
                ──────────────────────────────────────────────────────────────── */}
            {activeTab === 'model_info' && (
              <View style={styles.tabSection}>
                {/* Model Overview Hero Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Cpu size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>ML ENGINE METADATA (/model/info)</Text>
                    </View>
                    <View style={styles.modelStatusBadge}>
                      <View style={styles.modelStatusDot} />
                      <Text style={styles.modelStatusText}>{modelInfo.status}</Text>
                    </View>
                  </View>

                  <View style={styles.modelHeroContent}>
                    <Text style={styles.modelHeroTitle}>{modelInfo.model_name}</Text>
                    <Text style={styles.modelHeroSubtitle}>{modelInfo.algorithm}</Text>
                    <Text style={styles.modelHeroFramework}>
                      Version: {modelInfo.model_version} • Framework: {modelInfo.framework}
                    </Text>
                  </View>
                </View>

                {/* 4 Primary Metric Cards */}
                <View style={styles.metricsQuadGrid}>
                  {/* MAE */}
                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>MEAN ABS ERROR (MAE)</Text>
                    <Text style={[styles.metricQuadValue, { color: '#22C55E' }]}>
                      ±{modelInfo.metrics.mae_seconds}s
                    </Text>
                    <Text style={styles.metricQuadTarget}>Target: &lt; 30s • Excellent</Text>
                  </View>

                  {/* R2 Score */}
                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>R² DETERMINATION SCORE</Text>
                    <Text style={[styles.metricQuadValue, { color: '#38BDF8' }]}>
                      {modelInfo.metrics.r2_score}
                    </Text>
                    <Text style={styles.metricQuadTarget}>Variance explained: 94.2%</Text>
                  </View>

                  {/* Training Samples */}
                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>TRAINING SAMPLES</Text>
                    <Text style={[styles.metricQuadValue, { color: '#F59E0B' }]}>
                      {modelInfo.training_samples.toLocaleString()}
                    </Text>
                    <Text style={styles.metricQuadTarget}>GPS Corridors & Traces</Text>
                  </View>

                  {/* RMSE */}
                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>ROOT MEAN SQ (RMSE)</Text>
                    <Text style={[styles.metricQuadValue, { color: '#A855F7' }]}>
                      {modelInfo.metrics.rmse_seconds}s
                    </Text>
                    <Text style={styles.metricQuadTarget}>Median Error: {modelInfo.metrics.median_abs_error}s</Text>
                  </View>
                </View>

                {/* Feature Importance Breakdown */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Sliders size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>FEATURE IMPORTANCE RANKING</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      {modelInfo.features_count} inputs
                    </Text>
                  </View>

                  <View style={styles.featuresList}>
                    {modelInfo.feature_importances.map((feat, idx) => {
                      const pct = Math.round(feat.importance * 100);
                      return (
                        <View key={feat.feature} style={styles.featureItem}>
                          <View style={styles.featureLabelRow}>
                            <Text style={styles.featureName}>
                              {idx + 1}. {feat.feature}
                            </Text>
                            <Text style={styles.featurePercent}>{pct}% ({feat.importance.toFixed(3)})</Text>
                          </View>
                          <Text style={styles.featureDesc}>{feat.description}</Text>
                          <View style={styles.featureBarTrack}>
                            <View
                              style={[
                                styles.featureBarFill,
                                {
                                  width: `${pct}%`,
                                  backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#38BDF8' : '#22C55E',
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Model Hyperparameters Table */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>HYPERPARAMETERS & TRAINING SPECS</Text>
                    <TouchableOpacity
                      style={styles.miniCopyBtn}
                      onPress={() => handleCopy(JSON.stringify(modelInfo, null, 2), 'Model Info JSON')}
                    >
                      <Copy size={11} color="#38BDF8" />
                      <Text style={styles.miniCopyBtnText}>Copy Model JSON</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.hyperparamsTable}>
                    {Object.entries(modelInfo.hyperparameters).map(([key, val]) => (
                      <View key={key} style={styles.hyperparamRow}>
                        <Text style={styles.hyperparamKey}>{key}:</Text>
                        <Text style={styles.hyperparamVal}>{String(val)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ────────────────────────────────────────────────────────────────
                TAB 5: NETWORK STATS (GET /routes)
                ──────────────────────────────────────────────────────────────── */}
            {activeTab === 'network_stats' && (
              <View style={styles.tabSection}>
                {/* Agency Summary Hero */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Database size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>NETWORK INTELLIGENCE (/routes)</Text>
                    </View>
                    <View style={styles.agencyPill}>
                      <Text style={styles.agencyPillText}>CUMTA GTFS</Text>
                    </View>
                  </View>

                  <Text style={styles.networkAgencyTitle}>{networkStats.agency_name}</Text>
                  <Text style={styles.networkDbEngine}>
                    Database: {networkStats.database_type} • Index: {networkStats.spatial_index_status}
                  </Text>
                </View>

                {/* Network Primary KPIs */}
                <View style={styles.metricsQuadGrid}>
                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>TOTAL GTFS ROUTES</Text>
                    <Text style={[styles.metricQuadValue, { color: '#F59E0B' }]}>
                      {networkStats.total_routes}
                    </Text>
                    <Text style={styles.metricQuadTarget}>Metro & Feeder Lines</Text>
                  </View>

                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>GEOCODED STOPS</Text>
                    <Text style={[styles.metricQuadValue, { color: '#38BDF8' }]}>
                      {networkStats.total_stops.toLocaleString()}
                    </Text>
                    <Text style={styles.metricQuadTarget}>PostGIS Spatial Index</Text>
                  </View>

                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>SCHEDULED DAILY TRIPS</Text>
                    <Text style={[styles.metricQuadValue, { color: '#22C55E' }]}>
                      {networkStats.total_trips.toLocaleString()}
                    </Text>
                    <Text style={styles.metricQuadTarget}>Active Blocks: {networkStats.active_blocks}</Text>
                  </View>

                  <View style={styles.metricQuadCard}>
                    <Text style={styles.metricQuadLabel}>ON-TIME PERFORMANCE</Text>
                    <Text style={[styles.metricQuadValue, { color: '#A855F7' }]}>
                      {networkStats.on_time_performance_pct}%
                    </Text>
                    <Text style={styles.metricQuadTarget}>Avg Headway: {networkStats.avg_headway_min} min</Text>
                  </View>
                </View>

                {/* Top Busy Corridors */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <TrendingUp size={16} color="#F59E0B" />
                      <Text style={styles.cardTitle}>HIGH-FREQUENCY TRANSIT CORRIDORS</Text>
                    </View>
                  </View>

                  <View style={styles.corridorsList}>
                    {networkStats.busy_corridors.map((corridor, idx) => (
                      <View key={corridor.name} style={styles.corridorCard}>
                        <View style={styles.corridorTop}>
                          <View style={styles.corridorRoutePill}>
                            <Text style={styles.corridorRouteText}>{corridor.route_code}</Text>
                          </View>
                          <View style={styles.corridorMain}>
                            <Text style={styles.corridorName}>{corridor.name}</Text>
                            <Text style={styles.corridorStats}>
                              Frequency: {corridor.frequency_per_hr} buses/hr • Daily Ridership: ~{corridor.ridership_daily}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Database Specs & Sync Metadata */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>NEON DB ENGINE SPECIFICATIONS</Text>
                    <TouchableOpacity
                      style={styles.miniCopyBtn}
                      onPress={() => handleCopy(JSON.stringify(networkStats, null, 2), 'Network Stats JSON')}
                    >
                      <Copy size={11} color="#38BDF8" />
                      <Text style={styles.miniCopyBtnText}>Copy Stats JSON</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.hyperparamsTable}>
                    <View style={styles.hyperparamRow}>
                      <Text style={styles.hyperparamKey}>GTFS Feed Version:</Text>
                      <Text style={styles.hyperparamVal}>{networkStats.gtfs_feed_version}</Text>
                    </View>
                    <View style={styles.hyperparamRow}>
                      <Text style={styles.hyperparamKey}>Total Corridor Length:</Text>
                      <Text style={styles.hyperparamVal}>{networkStats.corridor_length_km} km</Text>
                    </View>
                    <View style={styles.hyperparamRow}>
                      <Text style={styles.hyperparamKey}>Peak Bus Requirement:</Text>
                      <Text style={styles.hyperparamVal}>{networkStats.peak_bus_requirement} units</Text>
                    </View>
                    <View style={styles.hyperparamRow}>
                      <Text style={styles.hyperparamKey}>Fleet Occupancy Avg:</Text>
                      <Text style={styles.hyperparamVal}>{networkStats.fleet_occupancy_avg}</Text>
                    </View>
                    <View style={styles.hyperparamRow}>
                      <Text style={styles.hyperparamKey}>Last Sync Timestamp:</Text>
                      <Text style={styles.hyperparamVal}>{networkStats.last_sync_timestamp}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1329',
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#022C22',
    borderColor: '#059669',
  },
  toastError: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
  },
  toastInfo: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },

  // Screen Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  judgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A03',
    borderWidth: 1,
    borderColor: '#D97706',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  judgeBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rawToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  rawToggleBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  rawToggleText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  rawToggleTextActive: {
    color: '#0F172A',
  },

  // Endpoint Status Bar
  endpointStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070E20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  endpointStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endpointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  endpointDotLive: {
    backgroundColor: '#22C55E',
  },
  endpointDotSim: {
    backgroundColor: '#F59E0B',
  },
  endpointStatusText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  copyUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copyUrlText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },

  // 5 Tab Navigation Bar
  tabBarContainer: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tabBarScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#0F172A',
  },
  tabCountPill: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: '#0F172A',
  },
  tabCountText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
  },
  tabCountTextActive: {
    color: '#F59E0B',
  },

  // Tab Section
  tabSection: {
    gap: 14,
  },

  // Generic Card
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Search Bar
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    height: '100%',
  },
  searchBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#F59E0B',
  },

  // Loading & Empty States
  loadingBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyActionBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyActionText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },

  // Routes List
  routesListContainer: {
    gap: 10,
  },
  routeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    gap: 10,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeCodePill: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  routeMainInfo: {
    flex: 1,
  },
  routeLongName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  routeIdLabel: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  expandChevron: {
    padding: 4,
  },
  routeStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  routeStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  routeStatLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  routeStatValue: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },

  // Route Expanded Inspector
  routeExpandedSection: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  routeExpandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeExpandedTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeExpandedActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniCopyBtnText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  inlineTreeBox: {
    backgroundColor: '#070E20',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  pageBtnTextDisabled: {
    color: '#64748B',
  },
  pageIndicatorText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Stops Tab Specifics
  selectedStopCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    gap: 12,
  },
  selectedStopTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedStopIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#451A03',
    borderWidth: 1,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStopHeaderInfo: {
    flex: 1,
  },
  selectedStopName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  selectedStopCoords: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  stopCoordsCopyBtn: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
  },

  nearbyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  nearbyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nearbySectionTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noArrivalsText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  arrivalsList: {
    gap: 8,
  },
  arrivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 10,
  },
  arrivalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  arrivalCodeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
  },
  arrivalCodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  arrivalRouteName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  arrivalVehicleId: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  arrivalRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  arrivalEtaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrivalEtaText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  arrivalOccBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  occDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  arrivalOccText: {
    fontSize: 9,
    fontWeight: '800',
  },
  copyStopPayloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  copyStopPayloadText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },

  // Stop Search Results
  stopsResultList: {
    gap: 6,
  },
  stopItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  stopItemRowSelected: {
    borderColor: '#F59E0B',
    borderWidth: 1,
    backgroundColor: '#172554',
  },
  stopItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  stopItemTexts: {
    flex: 1,
  },
  stopItemName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  stopItemNameSelected: {
    color: '#F59E0B',
  },
  stopItemId: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },

  // Live State Tab
  refreshSnapshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A03',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  refreshSnapshotText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  snapshotMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  snapshotMetricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  snapshotMetricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  snapshotMetricValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // JSON Tree Inspector Card
  jsonTreeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  jsonTreeToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  jsonTreeToolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jsonTreeTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  jsonTreeToolbarActions: {
    flexDirection: 'row',
    gap: 6,
  },
  treeActionBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  treeActionBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  treeCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  treeCopyBtnText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
  },
  jsonTreeBody: {
    padding: 12,
    backgroundColor: '#070E20',
  },

  // JSON Tree Node Syntax Elements
  jsonRowContainer: {
    marginVertical: 1,
  },
  jsonNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    flexWrap: 'wrap',
  },
  caretContainer: {
    width: 14,
    alignItems: 'center',
  },
  caretPlaceholder: {
    width: 14,
  },
  jsonKey: {
    color: '#93C5FD',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  jsonBracket: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  jsonCollapsedSummary: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontStyle: 'italic',
  },
  jsonString: {
    color: '#4ADE80',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  jsonNumber: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  jsonBoolean: {
    color: '#FBBF24',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  jsonNull: {
    color: '#F87171',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  jsonUndefined: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  jsonDefault: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  nodeCopyBtn: {
    marginLeft: 6,
    padding: 2,
    opacity: 0.7,
  },
  leafCopyBtn: {
    marginLeft: 6,
    padding: 2,
    opacity: 0.5,
  },

  // Model Info Specifics
  modelStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#022C22',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  modelStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  modelStatusText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '800',
  },
  modelHeroContent: {
    gap: 4,
  },
  modelHeroTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
  },
  modelHeroSubtitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  modelHeroFramework: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },

  // Metrics Quad Grid
  metricsQuadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricQuadCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    gap: 4,
  },
  metricQuadLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricQuadValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricQuadTarget: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },

  // Features List
  featuresList: {
    gap: 10,
  },
  featureItem: {
    gap: 4,
  },
  featureLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  featurePercent: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  featureDesc: {
    color: '#64748B',
    fontSize: 10,
  },
  featureBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  featureBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Hyperparameters Table
  hyperparamsTable: {
    backgroundColor: '#070E20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  hyperparamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  hyperparamKey: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  hyperparamVal: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },

  // Network Stats Specifics
  agencyPill: {
    backgroundColor: '#172554',
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  agencyPillText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800',
  },
  networkAgencyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  networkDbEngine: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  corridorsList: {
    gap: 8,
  },
  corridorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
  },
  corridorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  corridorRoutePill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
  },
  corridorRouteText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  corridorMain: {
    flex: 1,
  },
  corridorName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  corridorStats: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  // Raw JSON Card
  rawJsonCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  rawJsonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rawJsonHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rawJsonTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rawCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rawCopyBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  rawCodeBlock: {
    backgroundColor: '#070E20',
    padding: 14,
  },
  rawCodeText: {
    color: '#4ADE80',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
});
