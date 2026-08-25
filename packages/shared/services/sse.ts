// packages/shared/services/sse.ts — SSE connection manager class
import type { TransitSnapshot } from "../lib/types";
import { SSE_RECONNECT_DELAY_MS, SSE_MAX_RECONNECT_ATTEMPTS, API_BASE_URL } from "../lib/constants";

type Listener = (data: TransitSnapshot) => void;

export class SSEManager {
  private es: EventSource | null = null;
  private listeners: Set<Listener> = new Set();
  private attempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private mockData: TransitSnapshot;

  constructor(url = `${API_BASE_URL}/stream`) {
    this.url = url;
    this.mockData = this.getDefaultMock();
  }

  private getDefaultMock(): TransitSnapshot {
    return {
      ts: Math.floor(Date.now() / 1000),
      vehicle: { lat: 13.0302, lon: 80.1806, leg: "outbound", progress: 0.45, source: "gnss", trip_id: "trip_outbound_1", block_id: "block_001" },
      outbound: { T_outbound_sec: 420 },
      inbound: { trip_id: "trip_inbound_1", T_total_sec: 720, T_outbound_sec: 420, T_dwell_sec: 180, T_inbound_sec: 120, occupancy_band: "SEATS_AVAILABLE" },
      event_log: [],
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.connect();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.disconnect();
    };
  }

  private connect() {
    this.disconnect();
    if (this.timer) clearTimeout(this.timer);

    try {
      this.es = new EventSource(this.url);
      this.es.onopen = () => { this.attempts = 0; };
      this.es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notify(data);
        } catch {}
      };
      this.es.onerror = () => this.scheduleReconnect();
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.disconnect();
    if (this.attempts < SSE_MAX_RECONNECT_ATTEMPTS) {
      this.attempts++;
      this.timer = setTimeout(() => this.connect(), SSE_RECONNECT_DELAY_MS);
    }
  }

  private notify(data: TransitSnapshot) {
    this.listeners.forEach(l => l(data));
  }

  private disconnect() {
    this.es?.close();
    this.es = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  getMockData(): TransitSnapshot {
    return this.mockData;
  }
}

export const sseManager = new SSEManager();