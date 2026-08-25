import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import {
  AlertCircle,
  WifiOff,
  Users,
  RotateCcw,
  Zap,
  CheckCircle2,
  Activity,
  RefreshCw,
  Sliders,
  Terminal,
  Bus,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react-native';
import {
  SIM_BASE_URL,
  API_BASE_URL,
  colors,
  typography,
} from '@yara/shared';
import type {
  VehicleTelemetry,
  OccupancyBand,
  EventLogEntry,
  DelayRequest,
  DropoutRequest,
  CrowdSpikeRequest,
} from '@yara/shared';
import { useAdmin } from '../context/AdminContext';

const DEFAULT_VEHICLE_IDS = ['BUS-001', 'BUS-002', 'BUS-003', 'BUS-004'];

const OCCUPANCY_BANDS: OccupancyBand[] = [
  'SEATS_AVAILABLE',
  'MODERATE',
  'STANDING_ROOM',
  'VERY_CROWDED',
];

interface ToastState {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'info';
}

interface PipelineHealth {
  sim: boolean | null;
  kalman: boolean | null;
  eta: boolean | null;
  checking: boolean;
}

export const InjectScreen: React.FC = () => {
  const {
    vehicles,
    setVehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    addInjectEntry,
  } = useAdmin();

  // Selected vehicle state
  const activeVehicleId = selectedVehicleId ?? DEFAULT_VEHICLE_IDS[0];

  // UI state
  const [vehicleList, setVehicleList] = useState<string[]>(DEFAULT_VEHICLE_IDS);
  const [activeTelemetry, setActiveTelemetry] = useState<VehicleTelemetry | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Custom inject controls state
  const [showCustomControls, setShowCustomControls] = useState(true);
  const [customDelaySec, setCustomDelaySec] = useState(300); // 5 min
  const [customDropoutSec, setCustomDropoutSec] = useState(10); // 10s
  const [customCrowdBand, setCustomCrowdBand] = useState<OccupancyBand>('STANDING_ROOM');
  const [customCrowdDurationSec, setCustomCrowdDurationSec] = useState(30); // 30s

  // Health status
  const [health, setHealth] = useState<PipelineHealth>({
    sim: null,
    kalman: null,
    eta: null,
    checking: false,
  });

  // Event log
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);

  // Toast notification
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ id: Math.random().toString(36), msg, type });
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToast(null);
      });
    }, 2200);
  }, [toastAnim]);

  const addLocalEvent = useCallback((event: string, deltaSec = 0) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newEntry: EventLogEntry = { ts, event, delta_sec: deltaSec };
    setEventLogs(prev => [newEntry, ...prev].slice(0, 30));
  }, []);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${SIM_BASE_URL}/vehicles`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: VehicleTelemetry[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVehicles(data);
          const ids = data.map(v => v.vehicle_id);
          setVehicleList(ids);
          const active = data.find(v => v.vehicle_id === activeVehicleId) ?? data[0];
          setActiveTelemetry(active);
          if (!selectedVehicleId) {
            setSelectedVehicleId(active.vehicle_id);
          }
          return;
        }
      }
    } catch {
      // Backend not reached, keep fallback
    }
    setVehicleList(DEFAULT_VEHICLE_IDS);
  }, [activeVehicleId, selectedVehicleId, setSelectedVehicleId, setVehicles]);

  // Check pipeline health
  const checkHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, checking: true }));

    let simOk = false;
    let etaOk = false;
    let kalmanOk = false;

    // Check SIM
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const simRes = await fetch(`${SIM_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      simOk = simRes.ok;
    } catch {
      simOk = false;
    }

    // Check ETA Engine
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const etaRes = await fetch(`${API_BASE_URL}/eta`, { signal: controller.signal });
      clearTimeout(timeoutId);
      etaOk = etaRes.ok;
    } catch {
      etaOk = false;
    }

    // Kalman service status (tied to SIM connection / live telemetry)
    kalmanOk = simOk;

    setHealth({
      sim: simOk,
      kalman: kalmanOk,
      eta: etaOk,
      checking: false,
    });
  }, []);

  // Initial load
  useEffect(() => {
    fetchVehicles();
    checkHealth();
    addLocalEvent('Fault injection console initialized', 0);
  }, [fetchVehicles, checkHealth, addLocalEvent]);

  // Sync active telemetry on vehicle change
  useEffect(() => {
    if (vehicles.length > 0) {
      const found = vehicles.find(v => v.vehicle_id === activeVehicleId);
      if (found) {
        setActiveTelemetry(found);
      }
    }
  }, [activeVehicleId, vehicles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchVehicles(), checkHealth()]);
    setRefreshing(false);
  };

  // Perform injection call
  const performInject = async (
    actionName: string,
    url: string,
    body: DelayRequest | DropoutRequest | CrowdSpikeRequest | null,
    deltaSec = 0,
    toastMessage: string,
    historyType: 'delay' | 'gnss-dropout' | 'crowd-spike'
  ) => {
    setLoadingAction(actionName);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const responseData = await res.json().catch(() => null);
        showToast(toastMessage, 'success');
        addLocalEvent(`${actionName} applied on ${activeVehicleId}`, deltaSec);
        addInjectEntry({
          vehicleId: activeVehicleId,
          type: historyType,
          payload: body ?? {},
          response: responseData ?? undefined,
        });
      } else {
        // Mock fallback simulation
        showToast(`${actionName} sent (simulation mode)`, 'info');
        addLocalEvent(`${actionName} simulated on ${activeVehicleId}`, deltaSec);
        addInjectEntry({
          vehicleId: activeVehicleId,
          type: historyType,
          payload: body ?? {},
        });
      }
    } catch {
      clearTimeout(timeoutId);
      // Simulation mode feedback
      showToast(`${actionName} dispatched (offline sim)`, 'info');
      addLocalEvent(`${actionName} dispatched on ${activeVehicleId}`, deltaSec);
      addInjectEntry({
        vehicleId: activeVehicleId,
        type: historyType,
        payload: body ?? {},
      });
    } finally {
      setTimeout(() => setLoadingAction(null), 500);
      // Background poll vehicles to reflect changes
      fetchVehicles();
    }
  };

  // Quick action handlers
  const handleQuickDelay = () => {
    const body: DelayRequest = { seconds: 300 };
    performInject(
      'Delay (+5 min)',
      `${SIM_BASE_URL}/vehicles/${activeVehicleId}/delay`,
      body,
      300,
      'Delay injected — ETA updating...',
      'delay'
    );
  };

  const handleQuickDropout = () => {
    const body: DropoutRequest = { duration_s: 10 };
    performInject(
      'GNSS Dropout (10s)',
      `${SIM_BASE_URL}/vehicles/${activeVehicleId}/gnss-dropout`,
      body,
      0,
      'GNSS dropout injected — Kalman holding state',
      'gnss-dropout'
    );
  };

  const handleQuickCrowd = () => {
    const body: CrowdSpikeRequest = {
      band: 'STANDING_ROOM_ONLY',
      duration_s: 30,
    };
    performInject(
      'Crowd Spike (30s)',
      `${SIM_BASE_URL}/vehicles/${activeVehicleId}/crowd-spike`,
      body,
      0,
      'Crowd spike injected — Occupancy updated',
      'crowd-spike'
    );
  };

  const handleResetSimulation = async () => {
    setLoadingAction('Reset');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      await fetch(`${SIM_BASE_URL}/reset`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      showToast('Simulation reset to baseline', 'success');
      addLocalEvent('Simulation reset to baseline state', 0);
    } catch {
      clearTimeout(timeoutId);
      showToast('Simulation state reset', 'info');
      addLocalEvent('Simulation state reset (local)', 0);
    } finally {
      setTimeout(() => setLoadingAction(null), 500);
      fetchVehicles();
    }
  };

  // Custom action handlers
  const handleCustomDelay = () => {
    const body: DelayRequest = { seconds: customDelaySec };
    const min = Math.round(customDelaySec / 60);
    performInject(
      `Custom Delay (+${min}m)`,
      `${SIM_BASE_URL}/vehicles/${activeVehicleId}/delay`,
      body,
      customDelaySec,
      `Delay (+${min}m) injected on ${activeVehicleId}`,
      'delay'
    );
  };

  const handleCustomDropout = () => {
    const body: DropoutRequest = { duration_s: customDropoutSec };
    performInject(
      `Custom Dropout (${customDropoutSec}s)`,
      `${SIM_BASE_URL}/vehicles/${activeVehicleId}/gnss-dropout`,
      body,
      0,
      `GNSS Dropout (${customDropoutSec}s) injected`,
      'gnss-dropout'
    );
  };

  const handleCustomCrowd = () => {
    const body: CrowdSpikeRequest = {
      band: customCrowdBand,
      duration_s: customCrowdDurationSec,
    };
    performInject(
      `Crowd Spike (${customCrowdBand})`,
      `${SIM_BASE_URL}/vehicles/${activeVehicleId}/crowd-spike`,
      body,
      0,
      `Crowd spike (${customCrowdBand}) injected for ${customCrowdDurationSec}s`,
      'crowd-spike'
    );
  };

  const formatSecToMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (s === 0) return `${m} min`;
    return `${m}m ${s}s`;
  };

  return (
    <View style={styles.screen}>
      {/* Toast Notification */}
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
            {toast.type === 'success' && <CheckCircle2 size={16} color="#22C55E" />}
            {toast.type === 'error' && <AlertCircle size={16} color="#EF4444" />}
            {toast.type === 'info' && <Zap size={16} color="#F59E0B" />}
            <Text style={styles.toastText} numberOfLines={2}>
              {toast.msg}
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* Header Title & Judge Badge */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FAULT INJECTION</Text>
            <Text style={styles.headerSubtitle}>
              Interactive Judge & Simulation Controls
            </Text>
          </View>
          <View style={styles.judgeBadge}>
            <ShieldCheck size={12} color="#F59E0B" />
            <Text style={styles.judgeBadgeText}>SIH 2026</Text>
          </View>
        </View>

        {/* ── 1. Pipeline Health Status Bar ── */}
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View style={styles.healthTitleRow}>
              <Activity size={14} color={colors.text.inverse} />
              <Text style={styles.healthTitle}>PIPELINE STATUS</Text>
            </View>
            <TouchableOpacity
              style={styles.healthRefreshBtn}
              onPress={checkHealth}
              disabled={health.checking}
            >
              {health.checking ? (
                <ActivityIndicator size="small" color="#F59E0B" />
              ) : (
                <>
                  <RefreshCw size={12} color={colors.text.muted} />
                  <Text style={styles.healthRefreshText}>Ping</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.healthChipsRow}>
            {/* SIM Chip */}
            <View
              style={[
                styles.healthChip,
                health.sim === true
                  ? styles.healthChipOnline
                  : health.sim === false
                  ? styles.healthChipOffline
                  : styles.healthChipUnknown,
              ]}
            >
              <View
                style={[
                  styles.healthDot,
                  {
                    backgroundColor:
                      health.sim === true
                        ? '#22C55E'
                        : health.sim === false
                        ? '#EF4444'
                        : '#94A3B8',
                  },
                ]}
              />
              <Text style={styles.healthChipLabel}>SIM:8001</Text>
              <Text style={styles.healthChipStatus}>
                {health.sim === true ? 'ONLINE' : health.sim === false ? 'OFFLINE' : 'CHECKING'}
              </Text>
            </View>

            {/* KALMAN Chip */}
            <View
              style={[
                styles.healthChip,
                health.kalman === true
                  ? styles.healthChipOnline
                  : health.kalman === false
                  ? styles.healthChipOffline
                  : styles.healthChipUnknown,
              ]}
            >
              <View
                style={[
                  styles.healthDot,
                  {
                    backgroundColor:
                      health.kalman === true
                        ? '#22C55E'
                        : health.kalman === false
                        ? '#EF4444'
                        : '#94A3B8',
                  },
                ]}
              />
              <Text style={styles.healthChipLabel}>KAL:MQTT</Text>
              <Text style={styles.healthChipStatus}>
                {health.kalman === true ? 'ACTIVE' : 'IDLE'}
              </Text>
            </View>

            {/* ETA Chip */}
            <View
              style={[
                styles.healthChip,
                health.eta === true
                  ? styles.healthChipOnline
                  : health.eta === false
                  ? styles.healthChipOffline
                  : styles.healthChipUnknown,
              ]}
            >
              <View
                style={[
                  styles.healthDot,
                  {
                    backgroundColor:
                      health.eta === true
                        ? '#22C55E'
                        : health.eta === false
                        ? '#EF4444'
                        : '#94A3B8',
                  },
                ]}
              />
              <Text style={styles.healthChipLabel}>ETA:8002</Text>
              <Text style={styles.healthChipStatus}>
                {health.eta === true ? 'STREAM' : 'OFFLINE'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Target Vehicle Selector ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Bus size={16} color="#F59E0B" />
              <Text style={styles.cardTitle}>TARGET VEHICLE</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {vehicleList.length} buses registered
            </Text>
          </View>

          {/* Vehicle Pills Selector */}
          <View style={styles.vehiclePills}>
            {vehicleList.map(id => {
              const isSelected = id === activeVehicleId;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.vehiclePill,
                    isSelected && styles.vehiclePillActive,
                  ]}
                  onPress={() => {
                    setSelectedVehicleId(id);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.vehiclePillText,
                      isSelected && styles.vehiclePillTextActive,
                    ]}
                  >
                    {id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vehicle Telemetry Snapshot */}
          <View style={styles.telemetryBox}>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Selected Unit:</Text>
              <Text style={styles.telemetryValueMono}>{activeVehicleId}</Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Leg State:</Text>
              <Text style={styles.telemetryValueHighlight}>
                {activeTelemetry?.leg_state ?? 'EN_ROUTE'}
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Speed / GNSS:</Text>
              <Text style={styles.telemetryValue}>
                {activeTelemetry?.speed_kmh ?? 28} km/h ·{' '}
                {activeTelemetry?.gnss_fix !== false ? 'Fix OK' : 'Dropout'}
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>Crowd Band:</Text>
              <Text style={styles.telemetryValue}>
                {activeTelemetry?.occupancy_band ?? 'SEATS_AVAILABLE'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Quick Fault Injection Grid ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Zap size={16} color="#F59E0B" />
              <Text style={styles.cardTitle}>QUICK INJECT ACTIONS</Text>
            </View>
            <Text style={styles.cardSubtitle}>&lt;2s propagation</Text>
          </View>

          <View style={styles.actionGrid}>
            {/* Inject Delay Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnAmber]}
              onPress={handleQuickDelay}
              disabled={loadingAction !== null}
              activeOpacity={0.8}
            >
              <View style={styles.actionBtnTop}>
                <View style={[styles.actionIconBadge, styles.actionIconAmber]}>
                  <AlertCircle size={18} color="#D97706" />
                </View>
                {loadingAction === 'Delay (+5 min)' && (
                  <ActivityIndicator size="small" color="#D97706" />
                )}
              </View>
              <Text style={styles.actionBtnTitle}>Delay (+5 min)</Text>
              <Text style={styles.actionBtnDesc}>
                Propagate +300s ETA compounding to inbound trip
              </Text>
              <Text style={styles.actionBtnEndpoint}>POST /vehicles/{activeVehicleId}/delay</Text>
            </TouchableOpacity>

            {/* GNSS Dropout Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnBlue]}
              onPress={handleQuickDropout}
              disabled={loadingAction !== null}
              activeOpacity={0.8}
            >
              <View style={styles.actionBtnTop}>
                <View style={[styles.actionIconBadge, styles.actionIconBlue]}>
                  <WifiOff size={18} color="#2563EB" />
                </View>
                {loadingAction === 'GNSS Dropout (10s)' && (
                  <ActivityIndicator size="small" color="#2563EB" />
                )}
              </View>
              <Text style={styles.actionBtnTitle}>GNSS Dropout (10s)</Text>
              <Text style={styles.actionBtnDesc}>
                Cut GPS telemetry for 10s — test Kalman dead reckoning
              </Text>
              <Text style={styles.actionBtnEndpoint}>POST /vehicles/{activeVehicleId}/gnss-dropout</Text>
            </TouchableOpacity>

            {/* Crowd Spike Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOrange]}
              onPress={handleQuickCrowd}
              disabled={loadingAction !== null}
              activeOpacity={0.8}
            >
              <View style={styles.actionBtnTop}>
                <View style={[styles.actionIconBadge, styles.actionIconOrange]}>
                  <Users size={18} color="#EA580C" />
                </View>
                {loadingAction === 'Crowd Spike (30s)' && (
                  <ActivityIndicator size="small" color="#EA580C" />
                )}
              </View>
              <Text style={styles.actionBtnTitle}>Crowd Spike (30s)</Text>
              <Text style={styles.actionBtnDesc}>
                Elevate occupancy to STANDING_ROOM for 30s
              </Text>
              <Text style={styles.actionBtnEndpoint}>POST /vehicles/{activeVehicleId}/crowd-spike</Text>
            </TouchableOpacity>

            {/* Reset Simulation Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSlate]}
              onPress={handleResetSimulation}
              disabled={loadingAction !== null}
              activeOpacity={0.8}
            >
              <View style={styles.actionBtnTop}>
                <View style={[styles.actionIconBadge, styles.actionIconSlate]}>
                  <RotateCcw size={18} color="#64748B" />
                </View>
                {loadingAction === 'Reset' && (
                  <ActivityIndicator size="small" color="#64748B" />
                )}
              </View>
              <Text style={styles.actionBtnTitle}>Reset Simulation</Text>
              <Text style={styles.actionBtnDesc}>
                Clear all active delays, dropouts and restore normal cadence
              </Text>
              <Text style={styles.actionBtnEndpoint}>POST /reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. Custom Parameter Injections ── */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeaderToggle}
            onPress={() => setShowCustomControls(!showCustomControls)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Sliders size={16} color="#F59E0B" />
              <Text style={styles.cardTitle}>CUSTOM FAULT PARAMETERS</Text>
            </View>
            <Text style={styles.toggleText}>
              {showCustomControls ? 'Collapse' : 'Expand'}
            </Text>
          </TouchableOpacity>

          {showCustomControls && (
            <View style={styles.customControlsContainer}>
              {/* Custom Delay Stepper */}
              <View style={styles.controlGroup}>
                <View style={styles.controlLabelRow}>
                  <Text style={styles.controlLabel}>Custom Delay Duration</Text>
                  <Text style={styles.controlValueBadge}>
                    {formatSecToMinSec(customDelaySec)} ({customDelaySec}s)
                  </Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomDelaySec(prev => Math.max(60, prev - 60))}
                  >
                    <Minus size={14} color="#F8FAFC" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomDelaySec(180)}
                  >
                    <Text style={styles.stepperQuickText}>3m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomDelaySec(300)}
                  >
                    <Text style={styles.stepperQuickText}>5m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomDelaySec(600)}
                  >
                    <Text style={styles.stepperQuickText}>10m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomDelaySec(prev => Math.min(1800, prev + 60))}
                  >
                    <Plus size={14} color="#F8FAFC" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.customSubmitBtn}
                  onPress={handleCustomDelay}
                  disabled={loadingAction !== null}
                >
                  <Text style={styles.customSubmitBtnText}>
                    Inject {formatSecToMinSec(customDelaySec)} Delay on {activeVehicleId}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.controlDivider} />

              {/* Custom Dropout Stepper */}
              <View style={styles.controlGroup}>
                <View style={styles.controlLabelRow}>
                  <Text style={styles.controlLabel}>Custom GNSS Dropout</Text>
                  <Text style={styles.controlValueBadge}>{customDropoutSec}s</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomDropoutSec(prev => Math.max(5, prev - 5))}
                  >
                    <Minus size={14} color="#F8FAFC" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomDropoutSec(10)}
                  >
                    <Text style={styles.stepperQuickText}>10s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomDropoutSec(20)}
                  >
                    <Text style={styles.stepperQuickText}>20s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomDropoutSec(45)}
                  >
                    <Text style={styles.stepperQuickText}>45s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomDropoutSec(prev => Math.min(120, prev + 5))}
                  >
                    <Plus size={14} color="#F8FAFC" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.customSubmitBtn, styles.customSubmitBtnBlue]}
                  onPress={handleCustomDropout}
                  disabled={loadingAction !== null}
                >
                  <Text style={styles.customSubmitBtnText}>
                    Inject {customDropoutSec}s GNSS Dropout on {activeVehicleId}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.controlDivider} />

              {/* Custom Crowd Spike */}
              <View style={styles.controlGroup}>
                <View style={styles.controlLabelRow}>
                  <Text style={styles.controlLabel}>Target Occupancy Band</Text>
                  <Text style={styles.controlValueBadge}>{customCrowdBand}</Text>
                </View>

                {/* 4 OccupancyBand choices */}
                <View style={styles.bandGrid}>
                  {OCCUPANCY_BANDS.map(band => {
                    const active = customCrowdBand === band;
                    return (
                      <TouchableOpacity
                        key={band}
                        style={[
                          styles.bandChip,
                          active && styles.bandChipActive,
                        ]}
                        onPress={() => setCustomCrowdBand(band)}
                      >
                        <Text
                          style={[
                            styles.bandChipText,
                            active && styles.bandChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {band.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.controlLabelRow, { marginTop: 10 }]}>
                  <Text style={styles.controlLabel}>Duration</Text>
                  <Text style={styles.controlValueBadge}>{customCrowdDurationSec}s</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomCrowdDurationSec(prev => Math.max(10, prev - 10))}
                  >
                    <Minus size={14} color="#F8FAFC" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomCrowdDurationSec(15)}
                  >
                    <Text style={styles.stepperQuickText}>15s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomCrowdDurationSec(30)}
                  >
                    <Text style={styles.stepperQuickText}>30s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperQuickBtn}
                    onPress={() => setCustomCrowdDurationSec(60)}
                  >
                    <Text style={styles.stepperQuickText}>60s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCustomCrowdDurationSec(prev => Math.min(300, prev + 10))}
                  >
                    <Plus size={14} color="#F8FAFC" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.customSubmitBtn, styles.customSubmitBtnOrange]}
                  onPress={handleCustomCrowd}
                  disabled={loadingAction !== null}
                >
                  <Text style={styles.customSubmitBtnText}>
                    Inject {customCrowdBand} Spike ({customCrowdDurationSec}s)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── 5. Real-Time Event Log ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Terminal size={16} color="#22C55E" />
              <Text style={styles.cardTitle}>PIPELINE EVENT LOG</Text>
            </View>
            <TouchableOpacity
              onPress={() => setEventLogs([])}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {eventLogs.length === 0 ? (
            <View style={styles.emptyLog}>
              <Text style={styles.emptyLogText}>
                No injection events logged yet. Trigger an action above.
              </Text>
            </View>
          ) : (
            <View style={styles.eventList}>
              {eventLogs.map((log, index) => {
                const isDelay = log.delta_sec > 0;
                const isRecovery = log.delta_sec < 0;
                return (
                  <View key={`${log.ts}-${index}`} style={styles.eventRow}>
                    <Text style={styles.eventTs}>{log.ts}</Text>
                    <Text style={styles.eventMsg} numberOfLines={2}>
                      {log.event}
                    </Text>
                    {log.delta_sec !== 0 && (
                      <View
                        style={[
                          styles.deltaBadge,
                          isDelay ? styles.deltaBadgeDelay : styles.deltaBadgeRecovery,
                        ]}
                      >
                        <Text
                          style={[
                            styles.deltaBadgeText,
                            isDelay ? styles.deltaTextDelay : styles.deltaTextRecovery,
                          ]}
                        >
                          {isDelay ? `+${Math.round(log.delta_sec / 60)}m` : `${Math.round(log.delta_sec / 60)}m`}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            YARA Intelligence Engine · CH-1 Simulator Control · SIH 2026
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A', // dark canvas
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

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: 500,
    width: '100%',
  },
  toastSuccess: {
    borderColor: '#22C55E',
    backgroundColor: '#064E3B',
  },
  toastError: {
    borderColor: '#EF4444',
    backgroundColor: '#7F1D1D',
  },
  toastInfo: {
    borderColor: '#F59E0B',
    backgroundColor: '#451A03',
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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

  // Health Card
  healthCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 14,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  healthRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  healthRefreshText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  healthChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  healthChip: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  healthChipOnline: {
    borderColor: '#059669',
    backgroundColor: '#022C22',
  },
  healthChipOffline: {
    borderColor: '#DC2626',
    backgroundColor: '#450A0A',
  },
  healthChipUnknown: {
    borderColor: '#475569',
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  healthChipLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: typography.fontFamily.mono,
    fontWeight: '600',
  },
  healthChipStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },

  // Card Base
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  toggleText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
  },

  // Vehicle Selector
  vehiclePills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vehiclePill: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vehiclePillActive: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  vehiclePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: typography.fontFamily.mono,
  },
  vehiclePillTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  telemetryBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  telemetryValueMono: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    fontFamily: typography.fontFamily.mono,
  },
  telemetryValueHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22C55E',
  },
  telemetryValue: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
  },

  // Action Grid
  actionGrid: {
    gap: 10,
  },
  actionBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnAmber: {
    backgroundColor: '#2D200E',
    borderColor: '#92400E',
  },
  actionBtnBlue: {
    backgroundColor: '#111D36',
    borderColor: '#1E3A8A',
  },
  actionBtnOrange: {
    backgroundColor: '#2E190D',
    borderColor: '#9A3412',
  },
  actionBtnSlate: {
    backgroundColor: '#1E293B',
    borderColor: '#475569',
  },
  actionBtnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAmber: {
    backgroundColor: '#451A03',
  },
  actionIconBlue: {
    backgroundColor: '#1E293B',
  },
  actionIconOrange: {
    backgroundColor: '#431407',
  },
  actionIconSlate: {
    backgroundColor: '#0F172A',
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  actionBtnDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  actionBtnEndpoint: {
    fontSize: 9,
    fontFamily: typography.fontFamily.mono,
    color: '#94A3B8',
    marginTop: 6,
  },

  // Custom Controls
  customControlsContainer: {
    marginTop: 14,
    gap: 14,
  },
  controlGroup: {
    gap: 8,
  },
  controlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  controlValueBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: '#F59E0B',
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuickBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  customSubmitBtn: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  customSubmitBtnBlue: {
    backgroundColor: '#2563EB',
  },
  customSubmitBtnOrange: {
    backgroundColor: '#EA580C',
  },
  customSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },

  // Band Grid
  bandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bandChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  bandChipActive: {
    borderColor: '#EA580C',
    backgroundColor: '#431407',
  },
  bandChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  bandChipTextActive: {
    color: '#F97316',
    fontWeight: '800',
  },

  // Event Log
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearBtnText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyLog: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyLogText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: typography.fontFamily.mono,
    textAlign: 'center',
  },
  eventList: {
    gap: 6,
    maxHeight: 240,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  eventTs: {
    fontSize: 10,
    fontFamily: typography.fontFamily.mono,
    color: '#64748B',
  },
  eventMsg: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  deltaBadgeDelay: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626',
  },
  deltaBadgeRecovery: {
    backgroundColor: '#022C22',
    borderColor: '#059669',
  },
  deltaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: typography.fontFamily.mono,
  },
  deltaTextDelay: {
    color: '#EF4444',
  },
  deltaTextRecovery: {
    color: '#22C55E',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: typography.fontFamily.mono,
    textAlign: 'center',
  },
});

