// packages/shared/hooks/useTransitStream.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import EventSource, { EventSourceEvent } from 'react-native-sse';
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

export function useTransitStream(): UseTransitStreamResult {
  const [data, setData] = useState<TransitSnapshot>(DEFAULT_MOCK);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const connectSSE = useCallback(() => {
    if (esRef.current) {
      esRef.current.removeAllEventListeners();
      esRef.current.close();
      esRef.current = null;
    }

    try {
      const es = new EventSource(`${API_BASE_URL}/stream`);
      esRef.current = es;

      const handleOpen = () => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        setError(null);
      };

      const handleMessage = (event: EventSourceEvent) => {
        if (event.type === 'message' && event.data) {
          try {
            const parsed = JSON.parse(event.data) as TransitSnapshot;
            setData(parsed);
            setIsConnected(true);
            setError(null);
          } catch (err) {
            console.error('[useTransitStream] Failed to parse SSE payload', err);
          }
        }
      };

      const handleError = (_event: EventSourceEvent) => {
        setIsConnected(false);
        if (esRef.current) {
          esRef.current.removeAllEventListeners();
          esRef.current.close();
          esRef.current = null;
        }

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        if (reconnectAttemptsRef.current < SSE_MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(connectSSE, SSE_RECONNECT_DELAY_MS);
        } else {
          setError('Max reconnect attempts reached. Using mock fallback.');
          setData(DEFAULT_MOCK);
        }
      };

      es.addEventListener('open', handleOpen);
      es.addEventListener('message', handleMessage);
      es.addEventListener('error', handleError);
    } catch (err) {
      setIsConnected(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (reconnectAttemptsRef.current < SSE_MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connectSSE, SSE_RECONNECT_DELAY_MS);
      } else {
        setError('Failed to establish SSE connection. Using mock fallback.');
        setData(DEFAULT_MOCK);
      }
    }
  }, []);

  useEffect(() => {
    connectSSE();

    return () => {
      if (esRef.current) {
        esRef.current.removeAllEventListeners();
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectSSE]);

  return { data, isConnected, error };
}
