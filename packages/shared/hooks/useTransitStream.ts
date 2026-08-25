// packages/shared/hooks/useTransitStream.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import type { TransitSnapshot } from '../lib/types';
import {
  API_BASE_URL,
  BLOCK_ID,
  SSE_RECONNECT_DELAY_MS,
  SSE_MAX_RECONNECT_ATTEMPTS,
} from '../lib/constants';

export interface UseTransitStreamResult {
  data: TransitSnapshot;
  isConnected: boolean;
  error: string | null;
  isMockFallback: boolean;
  reconnectAttempts: number;
}

const DEFAULT_MOCK: TransitSnapshot = {
  ts: Math.floor(Date.now() / 1000),
  vehicle: {
    lat: 13.0302,
    lon: 80.1806,
    leg: 'outbound',
    progress: 0.45,
    source: 'gnss',
    trip_id: 'trip_outbound_1',
    block_id: BLOCK_ID,
  },
  outbound: {
    T_outbound_sec: 420,
  },
  inbound: {
    trip_id: 'trip_inbound_1',
    T_total_sec: 720,
    T_outbound_sec: 420,
    T_dwell_sec: 180,
    T_inbound_sec: 120,
    occupancy_band: 'SEATS_AVAILABLE',
  },
  event_log: [
    {
      ts: new Date().toLocaleTimeString('en-US', { hour12: false }),
      event: `System initialized — ${BLOCK_ID} active`,
      delta_sec: 0,
    },
  ],
};

function getNativeEventSource() {
  if (Platform.OS !== 'web') {
    try {
      // Dynamic require so Metro web bundle never evaluates 'react-native-sse'
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RNSSE = require('react-native-sse');
      return RNSSE.default || RNSSE;
    } catch {
      return null;
    }
  }
  return null;
}

export function useTransitStream(): UseTransitStreamResult {
  const [data, setData] = useState<TransitSnapshot>(DEFAULT_MOCK);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockFallback, setIsMockFallback] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const esRef = useRef<any>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const connectSSE = useCallback(() => {
    // Clean up existing connection if open
    if (esRef.current) {
      if (typeof esRef.current.removeAllEventListeners === 'function') {
        esRef.current.removeAllEventListeners();
      }
      if (typeof esRef.current.close === 'function') {
        esRef.current.close();
      }
      esRef.current = null;
    }

    const handleConnectionFailure = (errMsg: string) => {
      setIsConnected(false);

      if (esRef.current) {
        if (typeof esRef.current.removeAllEventListeners === 'function') {
          esRef.current.removeAllEventListeners();
        }
        if (typeof esRef.current.close === 'function') {
          esRef.current.close();
        }
        esRef.current = null;
      }

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (reconnectAttemptsRef.current < SSE_MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        setReconnectAttempts(reconnectAttemptsRef.current);
        reconnectTimerRef.current = setTimeout(connectSSE, SSE_RECONNECT_DELAY_MS);
      } else {
        setIsMockFallback(true);
        setError(errMsg || 'Max reconnect attempts reached. Using mock fallback.');
        setData(DEFAULT_MOCK);
        setReconnectAttempts(SSE_MAX_RECONNECT_ATTEMPTS);
      }
    };

    const isWeb = Platform.OS === 'web';
    const hasBrowserEventSource =
      typeof window !== 'undefined' && typeof window.EventSource !== 'undefined';

    try {
      if (isWeb && hasBrowserEventSource) {
        // Web Platform: use native browser window.EventSource
        const es = new window.EventSource(`${API_BASE_URL}/stream`);
        esRef.current = es;

        es.onopen = () => {
          reconnectAttemptsRef.current = 0;
          setReconnectAttempts(0);
          setIsConnected(true);
          setIsMockFallback(false);
          setError(null);
        };

        es.onmessage = (event: MessageEvent) => {
          if (event.data) {
            try {
              const parsed = JSON.parse(event.data) as TransitSnapshot;
              setData(parsed);
              setIsConnected(true);
              setIsMockFallback(false);
              setError(null);
            } catch (err) {
              console.error('[useTransitStream] Failed to parse SSE payload', err);
            }
          }
        };

        es.onerror = () => {
          handleConnectionFailure('Max reconnect attempts reached. Using mock fallback.');
        };
      } else {
        // Native Platform (iOS/Android): use react-native-sse
        const NativeEventSource = getNativeEventSource();
        if (!NativeEventSource) {
          handleConnectionFailure('Native SSE transport unavailable');
          return;
        }

        const es = new NativeEventSource(`${API_BASE_URL}/stream`);
        esRef.current = es;

        const handleOpen = () => {
          reconnectAttemptsRef.current = 0;
          setReconnectAttempts(0);
          setIsConnected(true);
          setIsMockFallback(false);
          setError(null);
        };

        const handleMessage = (event: any) => {
          if (event.type === 'message' && event.data) {
            try {
              const parsed = JSON.parse(event.data) as TransitSnapshot;
              setData(parsed);
              setIsConnected(true);
              setIsMockFallback(false);
              setError(null);
            } catch (err) {
              console.error('[useTransitStream] Failed to parse SSE payload', err);
            }
          }
        };

        const handleError = () => {
          handleConnectionFailure('Max reconnect attempts reached. Using mock fallback.');
        };

        es.addEventListener('open', handleOpen);
        es.addEventListener('message', handleMessage);
        es.addEventListener('error', handleError);
      }
    } catch (err) {
      handleConnectionFailure('Failed to establish SSE connection. Using mock fallback.');
    }
  }, []);

  useEffect(() => {
    connectSSE();

    return () => {
      if (esRef.current) {
        if (typeof esRef.current.removeAllEventListeners === 'function') {
          esRef.current.removeAllEventListeners();
        }
        if (typeof esRef.current.close === 'function') {
          esRef.current.close();
        }
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [connectSSE]);

  return {
    data,
    isConnected,
    error,
    isMockFallback,
    reconnectAttempts,
  };
}
