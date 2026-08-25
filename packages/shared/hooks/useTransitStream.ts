// packages/shared/hooks/useTransitStream.ts
import { useState, useEffect, useRef } from 'react';
import type { TransitSnapshot } from '../lib/types';
import { SSE_RECONNECT_DELAY_MS, SSE_MAX_RECONNECT_ATTEMPTS, API_BASE_URL } from '../lib/constants';

export interface UseTransitStreamReturn {
  data: TransitSnapshot | null;
  isConnected: boolean;
  error: string | null;
}

export function useTransitStream(url: string = `${API_BASE_URL}/stream`): UseTransitStreamReturn {
  const [data, setData] = useState<TransitSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef<number>(0);

  useEffect(() => {
    let es: any = null;
    let isMounted = true;

    const connect = () => {
      try {
        if (typeof EventSource !== 'undefined') {
          es = new EventSource(url);
          es.onopen = () => {
            if (!isMounted) return;
            setIsConnected(true);
            setError(null);
            reconnectAttempts.current = 0;
          };
          es.onmessage = (event: MessageEvent) => {
            if (!isMounted) return;
            try {
              const parsed: TransitSnapshot = JSON.parse(event.data);
              setData(parsed);
            } catch (e) {
              console.warn('[useTransitStream] parse error', e);
            }
          };
          es.onerror = () => {
            if (!isMounted) return;
            setIsConnected(false);
            if (reconnectAttempts.current < SSE_MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts.current += 1;
              setTimeout(connect, SSE_RECONNECT_DELAY_MS);
            } else {
              setError('Failed to connect to SSE stream');
            }
          };
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'SSE error');
          setIsConnected(false);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (es) {
        es.close();
      }
    };
  }, [url]);

  return { data, isConnected, error };
}
