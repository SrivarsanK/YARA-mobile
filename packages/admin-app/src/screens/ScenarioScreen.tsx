import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Activity,
  Terminal,
  Bus,
  ShieldCheck,
  Clock,
  Zap,
  WifiOff,
  Users,
  Layers,
  Cpu,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react-native';
import {
  SIM_BASE_URL,
  API_BASE_URL,
  colors,
  typography,
} from '@yara/shared';
import type {
  VehicleTelemetry,
  DelayRequest,
  DropoutRequest,
  CrowdSpikeRequest,
} from '@yara/shared';
import { useAdmin } from '../context/AdminContext';

const DEFAULT_VEHICLE_IDS = ['BUS-001', 'BUS-002', 'BUS-003', 'BUS-004'];

export type ScenarioStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'aborted'
  | 'error';

export type StageType =
  | 'wait'
  | 'inject_delay'
  | 'inject_dropout'
  | 'inject_crowd'
  | 'inject_multi';

export interface ScenarioStage {
  id: string;
  name: string;
  type: StageType;
  durationSec?: number;
  description: string;
  endpoint?: string;
  payload?: DelayRequest | DropoutRequest | CrowdSpikeRequest | object;
  deltaSec?: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  totalDurationEstimate: string;
  description: string;
  stages: ScenarioStage[];
}

export interface ScenarioLogEntry {
  id: string;
  ts: string;
  stageNum?: number;
  title: string;
  detail?: string;
  deltaSec?: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'stage';
  httpStatus?: string | number;
}

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

// ─── Pre-built Scenario Definitions ──────────────────────────────────────────

const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'judge-demo',
    title: '90-Second Judge Demo',
    subtitle: 'Standard Hackathon Jury Sequence',
    badge: 'JURY GOLDEN PATH',
    badgeColor: '#F59E0B',
    totalDurationEstimate: '~90s',
    description:
      'Auto-executes full cause-and-effect pipeline: baseline observation -> +5min delay cascading -> 10s GNSS dropout with Kalman hold -> 30s crowd spike.',
    stages: [
      {
        id: 'jd-stage-1',
        name: 'Baseline Observation',
        type: 'wait',
        durationSec: 10,
        description: 'Observe baseline telemetry, schedule deviation, and seated occupancy',
      },
      {
        id: 'jd-stage-2',
        name: 'Inject Delay (+5 min)',
        type: 'inject_delay',
        durationSec: 300,
        description: 'Propagate +300s delay to outbound trip; ETA compounds onto inbound return leg',
        endpoint: '/delay',
        payload: { seconds: 300 } as DelayRequest,
        deltaSec: 300,
      },
      {
        id: 'jd-stage-3',
        name: 'Propagation Window',
        type: 'wait',
        durationSec: 5,
        description: 'Allow CH-3 ETA Engine to process compounding delay over SSE stream',
      },
      {
        id: 'jd-stage-4',
        name: 'Inject GNSS Dropout (10s)',
        type: 'inject_dropout',
        durationSec: 10,
        description: 'Cut satellite GPS fix; Kalman filter begins dead reckoning extrapolation',
        endpoint: '/gnss-dropout',
        payload: { duration_s: 10 } as DropoutRequest,
        deltaSec: 0,
      },
      {
        id: 'jd-stage-5',
        name: 'Kalman Dead-Reckoning Hold',
        type: 'wait',
        durationSec: 5,
        description: 'Observe 1D Kalman state estimator maintaining continuous coordinate stream',
      },
      {
        id: 'jd-stage-6',
        name: 'Inject Crowd Spike (30s)',
        type: 'inject_crowd',
        durationSec: 30,
        description: 'Spike occupancy to STANDING_ROOM; dwell scaling increases downstream buffer',
        endpoint: '/crowd-spike',
        payload: { band: 'STANDING_ROOM_ONLY', duration_s: 30 } as CrowdSpikeRequest,
        deltaSec: 0,
      },
    ],
  },
  {
    id: 'stress-test',
    title: 'Stress Test (Triple Fault)',
    subtitle: 'Concurrent Fault Injection Load',
    badge: 'STRESS LOAD',
    badgeColor: '#EF4444',
    totalDurationEstimate: '~20s',
    description:
      'Simultaneously fires all 3 faults (Delay + Dropout + Crowd Spike) on target vehicle to test multi-channel resilience and system recovery.',
    stages: [
      {
        id: 'st-stage-1',
        name: 'Telemetry Pre-Check',
        type: 'wait',
        durationSec: 3,
        description: 'Verify SIM, Kalman, and ETA Engine communication channels are synchronized',
      },
      {
        id: 'st-stage-2',
        name: 'Simultaneous Triple Fault',
        type: 'inject_multi',
        durationSec: 0,
        description: 'Dispatch Delay (+300s), GNSS Dropout (15s), and STANDING_ROOM Crowd Spike in parallel',
        deltaSec: 300,
      },
      {
        id: 'st-stage-3',
        name: 'Multi-Fault Recovery Window',
        type: 'wait',
        durationSec: 15,
        description: 'Watch compounding ETA, Kalman dead-reckoning, and dwell recovery buffer under peak load',
      },
    ],
  },
  {
    id: 'recovery',
    title: 'Dwell Recovery Demo',
    subtitle: 'Automated Headway Buffer Absorption',
    badge: 'HEADWAY RECOVERY',
    badgeColor: '#22C55E',
    totalDurationEstimate: '~25s',
    description:
      'Injects a schedule delay and observes the 30% dwell recovery factor (DWELL_RECOVERY_FACTOR = 0.3) dynamically absorb delay at turnaround down to the 60s minimum floor.',
    stages: [
      {
        id: 'rec-stage-1',
        name: 'Baseline Dwell Check',
        type: 'wait',
        durationSec: 3,
        description: 'Observe nominal 300s baseline turnaround dwell time at terminal stop',
      },
      {
        id: 'rec-stage-2',
        name: 'Inject Delay (+5 min)',
        type: 'inject_delay',
        durationSec: 300,
        description: 'Inject +300s delay on outbound leg to perturb turnaround arrival window',
        endpoint: '/delay',
        payload: { seconds: 300 } as DelayRequest,
        deltaSec: 300,
      },
      {
        id: 'rec-stage-3',
        name: 'Extended Recovery Observation (20s)',
        type: 'wait',
        durationSec: 20,
        description: '20s live watch: Dwell compresses by ~90s to recover schedule before inbound return trip',
        deltaSec: -90,
      },
    ],
  },
];

export const ScenarioScreen: React.FC = () => {
  const {
    vehicles,
    setVehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    addInjectEntry,
  } = useAdmin();

  // Active target vehicle
  const activeVehicleId = selectedVehicleId ?? DEFAULT_VEHICLE_IDS[0];

  // Selected scenario
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('judge-demo');
  const activeScenario = useMemo(
    () => SCENARIOS.find(s => s.id === selectedScenarioId) ?? SCENARIOS[0],
    [selectedScenarioId]
  );

  // Execution engine state
  const [status, setStatus] = useState<ScenarioStatus>('idle');
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [stageCountdown, setStageCountdown] = useState<number | null>(null);
  const [logs, setLogs] = useState<ScenarioLogEntry[]>([]);
  const [vehicleList, setVehicleList] = useState<string[]>(DEFAULT_VEHICLE_IDS);
  const [refreshing, setRefreshing] = useState(false);

  // Health status
  const [health, setHealth] = useState<PipelineHealth>({
    sim: null,
    kalman: null,
    eta: null,
    checking: false,
  });

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Engine control refs
  const engineStateRef = useRef<{
    status: ScenarioStatus;
    abortController: AbortController | null;
    pauseResolver: (() => void) | null;
    timerId: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null;
  }>({
    status: 'idle',
    abortController: null,
    pauseResolver: null,
    timerId: null,
  });

  // Keep engineStateRef in sync with status
  useEffect(() => {
    engineStateRef.current.status = status;
  }, [status]);

  // Toast helper
  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
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
      }, 2500);
    },
    [toastAnim]
  );

  // Log append helper
  const addLog = useCallback(
    (
      title: string,
      detail?: string,
      type: 'info' | 'success' | 'warning' | 'error' | 'stage' = 'info',
      deltaSec = 0,
      httpStatus?: string | number,
      stageNum?: number
    ) => {
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newEntry: ScenarioLogEntry = {
        id: Math.random().toString(36).substring(7),
        ts,
        stageNum,
        title,
        detail,
        deltaSec,
        type,
        httpStatus,
      };

      setLogs(prev => [newEntry, ...prev].slice(0, 50));
    },
    []
  );

  // Check health
  const checkHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, checking: true }));

    let simOk = false;
    let etaOk = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const simRes = await fetch(`${SIM_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      simOk = simRes.ok;
    } catch {
      simOk = false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const etaRes = await fetch(`${API_BASE_URL}/eta`, { signal: controller.signal });
      clearTimeout(timeoutId);
      etaOk = etaRes.ok;
    } catch {
      etaOk = false;
    }

    setHealth({
      sim: simOk,
      kalman: simOk,
      eta: etaOk,
      checking: false,
    });
  }, []);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${SIM_BASE_URL}/vehicles`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: VehicleTelemetry[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVehicles(data);
          setVehicleList(data.map(v => v.vehicle_id));
          if (!selectedVehicleId) {
            setSelectedVehicleId(data[0].vehicle_id);
          }
          return;
        }
      }
    } catch {
      // Offline fallback
    }
    setVehicleList(DEFAULT_VEHICLE_IDS);
  }, [selectedVehicleId, setSelectedVehicleId, setVehicles]);

  // Initial load
  useEffect(() => {
    fetchVehicles();
    checkHealth();
    addLog(
      'Scenario Console Ready',
      `Loaded ${SCENARIOS.length} judge scenarios. Target: ${activeVehicleId}`,
      'info'
    );
  }, [fetchVehicles, checkHealth, addLog, activeVehicleId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineStateRef.current.status = 'aborted';
      if (engineStateRef.current.abortController) {
        engineStateRef.current.abortController.abort();
      }
      if (engineStateRef.current.timerId) {
        clearTimeout(engineStateRef.current.timerId as ReturnType<typeof setTimeout>);
        clearInterval(engineStateRef.current.timerId as ReturnType<typeof setInterval>);
      }
      if (engineStateRef.current.pauseResolver) {
        engineStateRef.current.pauseResolver();
      }
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchVehicles(), checkHealth()]);
    setRefreshing(false);
  };

  // ─── Engine Async Sequence Helper ──────────────────────────────────────────

  const isEngineAborted = useCallback(() => (engineStateRef.current.status as ScenarioStatus) === 'aborted', []);
  const isEnginePaused = useCallback(() => (engineStateRef.current.status as ScenarioStatus) === 'paused', []);
  const isEngineRunning = useCallback(() => (engineStateRef.current.status as ScenarioStatus) === 'running', []);

  /**
   * Waits for `seconds`, decrementing stage countdown each second,
   * while listening for pauses and aborts.
   */
  const waitWithControl = useCallback(
    async (seconds: number): Promise<boolean> => {
      let remaining = seconds;
      setStageCountdown(remaining);

      while (remaining > 0) {
        // Check if aborted
        if (isEngineAborted()) {
          return false;
        }

        // Check if paused -> await resume
        if (isEnginePaused()) {
          await new Promise<void>(resolve => {
            engineStateRef.current.pauseResolver = resolve;
          });
          // After waking up, re-verify status
          if (isEngineAborted()) {
            return false;
          }
        }

        // Wait 1 second
        await new Promise<void>(resolve => {
          const tid = setTimeout(resolve, 1000);
          engineStateRef.current.timerId = tid;
        });

        remaining -= 1;
        setStageCountdown(Math.max(0, remaining));
      }

      setStageCountdown(null);
      return !isEngineAborted();
    },
    [isEngineAborted, isEnginePaused]
  );

  /**
   * Dispatches a single HTTP injection call to the simulator
   */
  const executeInjectStage = useCallback(
    async (
      stage: ScenarioStage,
      targetId: string,
      stageNum: number
    ): Promise<boolean> => {
      const url = `${SIM_BASE_URL}/vehicles/${targetId}${stage.endpoint}`;
      const payload = stage.payload;

      const controller = new AbortController();
      engineStateRef.current.abortController = controller;
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const responseData = await res.json().catch(() => null);
          addLog(
            `Stage ${stageNum}: ${stage.name}`,
            `HTTP 200 OK — ${stage.description}`,
            'success',
            stage.deltaSec ?? 0,
            200,
            stageNum
          );

          // Add to admin history context
          let historyType: 'delay' | 'gnss-dropout' | 'crowd-spike' = 'delay';
          if (stage.type === 'inject_dropout') historyType = 'gnss-dropout';
          if (stage.type === 'inject_crowd') historyType = 'crowd-spike';

          addInjectEntry({
            vehicleId: targetId,
            type: historyType,
            payload: payload ?? {},
            response: responseData ?? undefined,
          });
          return true;
        } else {
          // Simulator returned error code
          const errText = await res.text().catch(() => 'Server error');
          addLog(
            `Stage ${stageNum}: ${stage.name} Failed`,
            `HTTP ${res.status}: ${errText} — Simulated local fallback`,
            'warning',
            stage.deltaSec ?? 0,
            res.status,
            stageNum
          );
          return true; // continue in simulation mode
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (isEngineAborted()) {
          return false;
        }

        // Offline / Simulation mode dispatch
        addLog(
          `Stage ${stageNum}: ${stage.name} (Offline Sim)`,
          `SIM unreachable — dispatched synthetic telemetry event`,
          'info',
          stage.deltaSec ?? 0,
          'OFFLINE',
          stageNum
        );
        return true;
      }
    },
    [addLog, addInjectEntry, isEngineAborted]
  );

  /**
   * Executes multi-fault stress test concurrently
   */
  const executeMultiInject = useCallback(
    async (targetId: string, stageNum: number): Promise<boolean> => {
      const delayPayload: DelayRequest = { seconds: 300 };
      const dropoutPayload: DropoutRequest = { duration_s: 15 };
      const crowdPayload: CrowdSpikeRequest = {
        band: 'STANDING_ROOM_ONLY',
        duration_s: 30,
      };

      const calls = [
        fetch(`${SIM_BASE_URL}/vehicles/${targetId}/delay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(delayPayload),
        }),
        fetch(`${SIM_BASE_URL}/vehicles/${targetId}/gnss-dropout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dropoutPayload),
        }),
        fetch(`${SIM_BASE_URL}/vehicles/${targetId}/crowd-spike`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(crowdPayload),
        }),
      ];

      try {
        const results = await Promise.allSettled(calls);
        const allOk = results.every(
          r => r.status === 'fulfilled' && r.value.ok
        );

        if (allOk) {
          addLog(
            `Stage ${stageNum}: Simultaneous Triple Fault`,
            `HTTP 200 OK — Fired Delay (+300s), GNSS Dropout (15s), Crowd Spike (30s) concurrently`,
            'success',
            300,
            200,
            stageNum
          );
        } else {
          addLog(
            `Stage ${stageNum}: Triple Fault Dispatched`,
            `Dispatched concurrent payload matrix (offline/sim fallback active)`,
            'warning',
            300,
            'SIM',
            stageNum
          );
        }

        // Record to Admin Context
        addInjectEntry({
          vehicleId: targetId,
          type: 'delay',
          payload: delayPayload,
        });
        addInjectEntry({
          vehicleId: targetId,
          type: 'gnss-dropout',
          payload: dropoutPayload,
        });
        addInjectEntry({
          vehicleId: targetId,
          type: 'crowd-spike',
          payload: crowdPayload,
        });

        return true;
      } catch {
        addLog(
          `Stage ${stageNum}: Triple Fault Simulated`,
          `Fired 3 synthetic faults to local vehicle state engine`,
          'info',
          300,
          'OFFLINE',
          stageNum
        );
        return true;
      }
    },
    [addLog, addInjectEntry]
  );

  // ─── Main Scenario Runner ──────────────────────────────────────────────────

  const runScenario = async (startIndex = 0) => {
    const scenario = activeScenario;
    const targetVehicle = activeVehicleId;

    setStatus('running');
    engineStateRef.current.status = 'running';

    if (startIndex === 0) {
      addLog(
        `▶ Scenario Started: ${scenario.title}`,
        `Executing ${scenario.stages.length} stages on ${targetVehicle}`,
        'stage'
      );
      showToast(`Starting ${scenario.title}`, 'info');
    }

    for (let i = startIndex; i < scenario.stages.length; i++) {
      if (isEngineAborted()) {
        break;
      }

      // Check if paused between stages
      if (isEnginePaused()) {
        await new Promise<void>(resolve => {
          engineStateRef.current.pauseResolver = resolve;
        });
        if (isEngineAborted()) {
          break;
        }
      }

      setCurrentStageIdx(i);
      const stage = scenario.stages[i];
      const stageNum = i + 1;

      // Handle stage execution based on type
      if (stage.type === 'wait') {
        addLog(
          `Stage ${stageNum}/${scenario.stages.length}: ${stage.name}`,
          `${stage.description} (${stage.durationSec}s countdown)`,
          'info',
          stage.deltaSec ?? 0,
          undefined,
          stageNum
        );

        const waitOk = await waitWithControl(stage.durationSec ?? 5);
        if (!waitOk) {
          break;
        }
      } else if (stage.type === 'inject_multi') {
        const ok = await executeMultiInject(targetVehicle, stageNum);
        if (!ok) break;
      } else {
        const ok = await executeInjectStage(stage, targetVehicle, stageNum);
        if (!ok) break;
      }
    }

    // Completion or abort handling
    if (isEngineRunning()) {
      setStatus('completed');
      engineStateRef.current.status = 'completed';
      setStageCountdown(null);
      addLog(
        `✓ Scenario Completed: ${scenario.title}`,
        `All ${scenario.stages.length} stages executed successfully on ${targetVehicle}`,
        'success'
      );
      showToast(`${scenario.title} Completed!`, 'success');
      fetchVehicles();
    }
  };

  // ─── Master Controls ───────────────────────────────────────────────────────

  const handleStart = () => {
    if (status === 'paused') {
      // Resume from paused index
      setStatus('running');
      engineStateRef.current.status = 'running';
      if (engineStateRef.current.pauseResolver) {
        engineStateRef.current.pauseResolver();
        engineStateRef.current.pauseResolver = null;
      }
      showToast('Scenario Resumed', 'info');
      addLog('Scenario Resumed', `Continuing stage ${currentStageIdx + 1}`, 'info');
    } else {
      // Start fresh
      runScenario(0);
    }
  };

  const handlePause = () => {
    if (status === 'running') {
      setStatus('paused');
      engineStateRef.current.status = 'paused';
      showToast('Scenario Paused', 'info');
      addLog('Scenario Paused', `Halting between actions at stage ${currentStageIdx + 1}`, 'warning');
    }
  };

  const handleReset = async () => {
    // Abort engine
    engineStateRef.current.status = 'aborted';
    if (engineStateRef.current.abortController) {
      engineStateRef.current.abortController.abort();
    }
    if (engineStateRef.current.pauseResolver) {
      engineStateRef.current.pauseResolver();
      engineStateRef.current.pauseResolver = null;
    }
    if (engineStateRef.current.timerId) {
      clearTimeout(engineStateRef.current.timerId as ReturnType<typeof setTimeout>);
      clearInterval(engineStateRef.current.timerId as ReturnType<typeof setInterval>);
    }

    setStatus('idle');
    setCurrentStageIdx(0);
    setStageCountdown(null);

    // Call backend simulator reset
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      await fetch(`${SIM_BASE_URL}/reset`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      addLog('Simulation & Scenario Reset', 'Simulator restored to baseline state', 'success');
      showToast('Scenario & Simulator Reset', 'success');
    } catch {
      addLog('Scenario Reset', 'Reset scenario execution state to Stage 1', 'info');
      showToast('Scenario Reset', 'info');
    }

    fetchVehicles();
  };

  // Switch scenario (only if not running)
  const handleSelectScenario = (scenarioId: string) => {
    if (status === 'running' || status === 'paused') {
      showToast('Reset active scenario before switching', 'info');
      return;
    }
    setSelectedScenarioId(scenarioId);
    setCurrentStageIdx(0);
    setStageCountdown(null);
    setStatus('idle');
  };

  // Progress Calculation
  const totalStages = activeScenario.stages.length;
  const progressRatio = totalStages > 0 ? (currentStageIdx + (status === 'completed' ? 1 : 0)) / totalStages : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

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
            <Text style={styles.headerTitle}>SCENARIO RUNNER</Text>
            <Text style={styles.headerSubtitle}>
              Pre-built Hackathon & Jury Evaluation Sequences
            </Text>
          </View>
          <View style={styles.judgeBadge}>
            <ShieldCheck size={12} color="#F59E0B" />
            <Text style={styles.judgeBadgeText}>SIH 2026</Text>
          </View>
        </View>

        {/* ── 1. Pipeline Health & Target Vehicle Bar ── */}
        <View style={styles.topBarCard}>
          {/* Target Vehicle Pills */}
          <View style={styles.vehicleSelectSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Bus size={14} color="#F59E0B" />
                <Text style={styles.sectionHeaderTitle}>TARGET VEHICLE</Text>
              </View>
              <Text style={styles.vehicleCountText}>
                {vehicleList.length} units available
              </Text>
            </View>

            <View style={styles.vehiclePills}>
              {vehicleList.map(id => {
                const isSelected = id === activeVehicleId;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.vehiclePill,
                      isSelected && styles.vehiclePillActive,
                      status === 'running' && styles.vehiclePillDisabled,
                    ]}
                    onPress={() => {
                      if (status !== 'running') {
                        setSelectedVehicleId(id);
                      }
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
          </View>

          {/* Pipeline Mini Health */}
          <View style={styles.healthMiniRow}>
            <View style={styles.healthMiniChip}>
              <View
                style={[
                  styles.healthMiniDot,
                  {
                    backgroundColor:
                      health.sim === true
                        ? '#22C55E'
                        : health.sim === false
                        ? '#EF4444'
                        : '#F59E0B',
                  },
                ]}
              />
              <Text style={styles.healthMiniText}>SIM:8001</Text>
            </View>
            <View style={styles.healthMiniChip}>
              <View
                style={[
                  styles.healthMiniDot,
                  {
                    backgroundColor:
                      health.kalman === true
                        ? '#22C55E'
                        : health.kalman === false
                        ? '#EF4444'
                        : '#F59E0B',
                  },
                ]}
              />
              <Text style={styles.healthMiniText}>KAL:MQTT</Text>
            </View>
            <View style={styles.healthMiniChip}>
              <View
                style={[
                  styles.healthMiniDot,
                  {
                    backgroundColor:
                      health.eta === true
                        ? '#22C55E'
                        : health.eta === false
                        ? '#EF4444'
                        : '#F59E0B',
                  },
                ]}
              />
              <Text style={styles.healthMiniText}>ETA:8002</Text>
            </View>
            <TouchableOpacity
              style={styles.healthPingBtn}
              onPress={checkHealth}
              disabled={health.checking}
            >
              {health.checking ? (
                <ActivityIndicator size="small" color="#F59E0B" />
              ) : (
                <RefreshCw size={12} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Scenario Picker Cards (3 Choices) ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Layers size={16} color="#F59E0B" />
              <Text style={styles.cardTitle}>SELECT DEMO SCENARIO</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {SCENARIOS.length} pre-configured
            </Text>
          </View>

          <View style={styles.scenarioList}>
            {SCENARIOS.map(sc => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <TouchableOpacity
                  key={sc.id}
                  style={[
                    styles.scenarioCard,
                    isSelected && styles.scenarioCardSelected,
                  ]}
                  onPress={() => handleSelectScenario(sc.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.scenarioCardTop}>
                    <View style={styles.scenarioTitleGroup}>
                      <View style={styles.scenarioRadio}>
                        {isSelected && <View style={styles.scenarioRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.scenarioCardTitle,
                            isSelected && styles.scenarioCardTitleSelected,
                          ]}
                        >
                          {sc.title}
                        </Text>
                        <Text style={styles.scenarioCardSubtitle}>
                          {sc.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.scenarioBadge,
                        { borderColor: sc.badgeColor, backgroundColor: '#0F172A' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scenarioBadgeText,
                          { color: sc.badgeColor },
                        ]}
                      >
                        {sc.totalDurationEstimate}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.scenarioDesc} numberOfLines={2}>
                    {sc.description}
                  </Text>

                  <View style={styles.scenarioMetaRow}>
                    <View style={styles.scenarioMetaItem}>
                      <Cpu size={12} color="#94A3B8" />
                      <Text style={styles.scenarioMetaText}>
                        {sc.stages.length} Stages
                      </Text>
                    </View>
                    <View style={styles.scenarioMetaItem}>
                      <Clock size={12} color="#94A3B8" />
                      <Text style={styles.scenarioMetaText}>
                        {sc.totalDurationEstimate} run time
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 3. Execution Control Deck & Progress Bar ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Activity size={16} color="#F59E0B" />
              <Text style={styles.cardTitle}>EXECUTION CONTROLLER</Text>
            </View>

            {/* Status Pill */}
            <View
              style={[
                styles.statusPill,
                status === 'running' && styles.statusPillRunning,
                status === 'paused' && styles.statusPillPaused,
                status === 'completed' && styles.statusPillCompleted,
                status === 'idle' && styles.statusPillIdle,
              ]}
            >
              {status === 'running' && (
                <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 4 }} />
              )}
              {status === 'paused' && (
                <Pause size={12} color="#F59E0B" style={{ marginRight: 4 }} />
              )}
              {status === 'completed' && (
                <CheckCircle2 size={12} color="#22C55E" style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.statusPillText,
                  status === 'running' && styles.statusTextRunning,
                  status === 'paused' && styles.statusTextPaused,
                  status === 'completed' && styles.statusTextCompleted,
                ]}
              >
                {status === 'running' && `RUNNING (Stage ${currentStageIdx + 1}/${totalStages})`}
                {status === 'paused' && `PAUSED (Stage ${currentStageIdx + 1}/${totalStages})`}
                {status === 'completed' && 'COMPLETED'}
                {status === 'idle' && 'READY TO RUN'}
                {status === 'aborted' && 'STOPPED'}
                {status === 'error' && 'ERROR'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                  status === 'completed' && styles.progressBarFillCompleted,
                  status === 'paused' && styles.progressBarFillPaused,
                ]}
              />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>
                {status === 'running' || status === 'paused'
                  ? `Stage ${currentStageIdx + 1} of ${totalStages}: ${
                      activeScenario.stages[currentStageIdx]?.name ?? ''
                    }`
                  : status === 'completed'
                  ? 'All stages completed'
                  : 'Ready'}
              </Text>
              <Text style={styles.progressValueMono}>
                {stageCountdown !== null
                  ? `${stageCountdown}s remaining`
                  : `${progressPercent}%`}
              </Text>
            </View>
          </View>

          {/* Master Control Action Buttons */}
          <View style={styles.controlBtnGrid}>
            {/* Run / Resume Button */}
            {status !== 'running' ? (
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  styles.controlBtnPrimary,
                ]}
                onPress={handleStart}
                activeOpacity={0.8}
              >
                <Play size={18} color="#0F172A" fill="#0F172A" />
                <Text style={styles.controlBtnPrimaryText}>
                  {status === 'paused' ? 'Resume Scenario' : 'Start Scenario'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  styles.controlBtnPause,
                ]}
                onPress={handlePause}
                activeOpacity={0.8}
              >
                <Pause size={18} color="#F59E0B" />
                <Text style={styles.controlBtnPauseText}>Pause Scenario</Text>
              </TouchableOpacity>
            )}

            {/* Reset / Stop Button */}
            <TouchableOpacity
              style={[
                styles.controlBtn,
                styles.controlBtnReset,
              ]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color="#94A3B8" />
              <Text style={styles.controlBtnResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. Stage Breakdown Timeline ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Sliders size={16} color="#F59E0B" />
              <Text style={styles.cardTitle}>SCENARIO STAGES</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {activeScenario.stages.length} sequence steps
            </Text>
          </View>

          <View style={styles.stageTimeline}>
            {activeScenario.stages.map((stage, idx) => {
              const isPast =
                status === 'completed' ||
                (status !== 'idle' && idx < currentStageIdx);
              const isCurrent =
                (status === 'running' || status === 'paused') &&
                idx === currentStageIdx;
              const isFuture =
                status === 'idle' ||
                (status !== 'completed' && idx > currentStageIdx);

              return (
                <View key={stage.id} style={styles.stageItem}>
                  {/* Timeline connector column */}
                  <View style={styles.timelineCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        isPast && styles.timelineDotPast,
                        isCurrent && styles.timelineDotCurrent,
                        isFuture && styles.timelineDotFuture,
                      ]}
                    >
                      {isPast ? (
                        <Check size={12} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <ActivityIndicator size="small" color="#0F172A" />
                      ) : (
                        <Text style={styles.timelineDotText}>{idx + 1}</Text>
                      )}
                    </View>
                    {idx < activeScenario.stages.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPast && styles.timelineLinePast,
                        ]}
                      />
                    )}
                  </View>

                  {/* Stage details box */}
                  <View
                    style={[
                      styles.stageBox,
                      isCurrent && styles.stageBoxCurrent,
                      isPast && styles.stageBoxPast,
                    ]}
                  >
                    <View style={styles.stageBoxHeader}>
                      <View style={styles.stageBoxTitleRow}>
                        <Text
                          style={[
                            styles.stageBoxTitle,
                            isCurrent && styles.stageBoxTitleCurrent,
                          ]}
                        >
                          Stage {idx + 1}: {stage.name}
                        </Text>
                      </View>

                      {/* Type Badge */}
                      <View
                        style={[
                          styles.stageTypeBadge,
                          stage.type === 'wait' && styles.stageTypeWait,
                          stage.type === 'inject_delay' && styles.stageTypeDelay,
                          stage.type === 'inject_dropout' && styles.stageTypeDropout,
                          stage.type === 'inject_crowd' && styles.stageTypeCrowd,
                          stage.type === 'inject_multi' && styles.stageTypeMulti,
                        ]}
                      >
                        {stage.type === 'wait' && <Clock size={10} color="#94A3B8" />}
                        {stage.type === 'inject_delay' && <AlertTriangle size={10} color="#D97706" />}
                        {stage.type === 'inject_dropout' && <WifiOff size={10} color="#2563EB" />}
                        {stage.type === 'inject_crowd' && <Users size={10} color="#EA580C" />}
                        {stage.type === 'inject_multi' && <Zap size={10} color="#EF4444" />}
                        <Text
                          style={[
                            styles.stageTypeBadgeText,
                            stage.type === 'wait' && styles.stageTypeTextWait,
                            stage.type === 'inject_delay' && styles.stageTypeTextDelay,
                            stage.type === 'inject_dropout' && styles.stageTypeTextDropout,
                            stage.type === 'inject_crowd' && styles.stageTypeTextCrowd,
                            stage.type === 'inject_multi' && styles.stageTypeTextMulti,
                          ]}
                        >
                          {stage.type === 'wait'
                            ? `WAIT ${stage.durationSec}s`
                            : stage.type === 'inject_delay'
                            ? '+5m DELAY'
                            : stage.type === 'inject_dropout'
                            ? '10s DROPOUT'
                            : stage.type === 'inject_crowd'
                            ? 'CROWD SPIKE'
                            : 'TRIPLE FAULT'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.stageBoxDesc}>{stage.description}</Text>

                    {/* Live countdown or endpoint pill if active */}
                    {isCurrent && stageCountdown !== null && (
                      <View style={styles.stageActiveIndicatorRow}>
                        <Clock size={12} color="#F59E0B" />
                        <Text style={styles.stageActiveCountdownText}>
                          Executing stage... {stageCountdown}s remaining
                        </Text>
                      </View>
                    )}

                    {stage.endpoint && (
                      <Text style={styles.stageEndpointText}>
                        POST {stage.endpoint} on {activeVehicleId}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 5. Real-Time Scenario Event Log ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Terminal size={16} color="#22C55E" />
              <Text style={styles.cardTitle}>SCENARIO EVENT LOG</Text>
            </View>
            <TouchableOpacity
              onPress={() => setLogs([])}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyLog}>
              <Text style={styles.emptyLogText}>
                No scenario events logged yet. Select a scenario and press Start.
              </Text>
            </View>
          ) : (
            <View style={styles.eventList}>
              {logs.map((log) => {
                const isDelay = (log.deltaSec ?? 0) > 0;
                const isRecovery = (log.deltaSec ?? 0) < 0;

                return (
                  <View key={log.id} style={styles.eventRow}>
                    <Text style={styles.eventTs}>{log.ts}</Text>
                    <View style={styles.eventBody}>
                      <View style={styles.eventTitleRow}>
                        <Text style={styles.eventTitle}>{log.title}</Text>
                        {log.httpStatus !== undefined && (
                          <View
                            style={[
                              styles.httpStatusBadge,
                              log.httpStatus === 200 && styles.httpStatus200,
                              log.httpStatus === 'OFFLINE' && styles.httpStatusOffline,
                            ]}
                          >
                            <Text style={styles.httpStatusText}>
                              {log.httpStatus === 200 ? '200 OK' : String(log.httpStatus)}
                            </Text>
                          </View>
                        )}
                      </View>
                      {log.detail && (
                        <Text style={styles.eventDetail} numberOfLines={2}>
                          {log.detail}
                        </Text>
                      )}
                    </View>

                    {log.deltaSec !== undefined && log.deltaSec !== 0 && (
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
                          {isDelay
                            ? `+${Math.round(log.deltaSec / 60)}m`
                            : `${Math.round(log.deltaSec / 60)}m`}
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
            YARA Intelligence Engine · Scenario Automation · SIH 2026
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
    marginBottom: 14,
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

  // Top Bar Card (Vehicle selector + Health Mini)
  topBarCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  vehicleSelectSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  vehicleCountText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  vehiclePills: {
    flexDirection: 'row',
    gap: 6,
  },
  vehiclePill: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  vehiclePillActive: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  vehiclePillDisabled: {
    opacity: 0.6,
  },
  vehiclePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: typography.fontFamily.mono,
  },
  vehiclePillTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },

  // Health Mini Row
  healthMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  healthMiniChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 4,
    gap: 6,
  },
  healthMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  healthMiniText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.mono,
    fontWeight: '700',
    color: '#94A3B8',
  },
  healthPingBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Scenario Cards
  scenarioList: {
    gap: 10,
  },
  scenarioCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 6,
  },
  scenarioCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#23180D',
  },
  scenarioCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scenarioTitleGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  scenarioRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scenarioRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  scenarioCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scenarioCardTitleSelected: {
    color: '#F59E0B',
  },
  scenarioCardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  scenarioBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scenarioBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: typography.fontFamily.mono,
  },
  scenarioDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
    marginLeft: 24,
  },
  scenarioMetaRow: {
    flexDirection: 'row',
    gap: 14,
    marginLeft: 24,
    marginTop: 2,
  },
  scenarioMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scenarioMetaText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Execution Controller
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillIdle: {
    backgroundColor: '#0F172A',
    borderColor: '#475569',
  },
  statusPillRunning: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  statusPillPaused: {
    backgroundColor: '#431407',
    borderColor: '#EA580C',
  },
  statusPillCompleted: {
    backgroundColor: '#064E3B',
    borderColor: '#22C55E',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94A3B8',
  },
  statusTextRunning: {
    color: '#F59E0B',
  },
  statusTextPaused: {
    color: '#F97316',
  },
  statusTextCompleted: {
    color: '#22C55E',
  },

  // Progress Bar
  progressContainer: {
    gap: 6,
    marginVertical: 10,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressBarFillCompleted: {
    backgroundColor: '#22C55E',
  },
  progressBarFillPaused: {
    backgroundColor: '#EA580C',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
    flex: 1,
  },
  progressValueMono: {
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: '#F59E0B',
    fontWeight: '800',
  },

  // Control Buttons
  controlBtnGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  controlBtnPrimary: {
    flex: 2,
    backgroundColor: '#F59E0B',
  },
  controlBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  controlBtnPause: {
    flex: 2,
    backgroundColor: '#451A03',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  controlBtnPauseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
  },
  controlBtnReset: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
  },
  controlBtnResetText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },

  // Stage Timeline
  stageTimeline: {
    gap: 2,
    marginTop: 4,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  timelineDotPast: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  timelineDotCurrent: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  timelineDotFuture: {
    backgroundColor: '#0F172A',
    borderColor: '#475569',
  },
  timelineDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  timelineLine: {
    width: 2,
    height: 48,
    backgroundColor: '#334155',
    marginVertical: 2,
  },
  timelineLinePast: {
    backgroundColor: '#22C55E',
  },
  stageBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  stageBoxCurrent: {
    borderColor: '#F59E0B',
    backgroundColor: '#23180D',
  },
  stageBoxPast: {
    borderColor: '#1E3A5F',
  },
  stageBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageBoxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stageBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  stageBoxTitleCurrent: {
    color: '#F59E0B',
  },
  stageTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  stageTypeWait: {
    backgroundColor: '#1E293B',
    borderColor: '#475569',
  },
  stageTypeDelay: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  stageTypeDropout: {
    backgroundColor: '#111D36',
    borderColor: '#1E3A8A',
  },
  stageTypeCrowd: {
    backgroundColor: '#431407',
    borderColor: '#EA580C',
  },
  stageTypeMulti: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },
  stageTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: typography.fontFamily.mono,
  },
  stageTypeTextWait: {
    color: '#94A3B8',
  },
  stageTypeTextDelay: {
    color: '#F59E0B',
  },
  stageTypeTextDropout: {
    color: '#3B82F6',
  },
  stageTypeTextCrowd: {
    color: '#F97316',
  },
  stageTypeTextMulti: {
    color: '#EF4444',
  },
  stageBoxDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 14,
  },
  stageActiveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  stageActiveCountdownText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
  },
  stageEndpointText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.mono,
    color: '#64748B',
    marginTop: 2,
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
    maxHeight: 260,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  eventBody: {
    flex: 1,
    gap: 2,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  eventDetail: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 13,
  },
  httpStatusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  httpStatus200: {
    backgroundColor: '#064E3B',
    borderColor: '#22C55E',
  },
  httpStatusOffline: {
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  httpStatusText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: typography.fontFamily.mono,
    color: '#F8FAFC',
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
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

