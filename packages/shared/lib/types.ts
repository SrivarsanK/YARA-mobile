// packages/shared/lib/types.ts — LOCKED

export type OccupancyBand =
  | 'SEATS_AVAILABLE'
  | 'MODERATE'
  | 'STANDING_ROOM'
  | 'VERY_CROWDED';

export type BusLeg = 'outbound' | 'dwell' | 'inbound';
export type ETAMode = 'ml' | 'calculative';
export type GNSSSource = 'gnss' | 'kalman_estimated';
export type LegState = 'EN_ROUTE' | 'DWELL' | 'HOLD';

// SSE payload from GET /stream
export interface TransitSnapshot {
  ts: number;
  vehicle: {
    lat: number;
    lon: number;
    leg: BusLeg;
    progress: number;
    source: GNSSSource;
    trip_id: string;
    block_id: string;
  };
  outbound: { T_outbound_sec: number };
  inbound: {
    trip_id: string;
    T_total_sec: number;
    T_outbound_sec: number;
    T_dwell_sec: number;
    T_inbound_sec: number;
    occupancy_band: OccupancyBand;
  };
  event_log: EventLogEntry[];
}

// REST payloads from /api/routes, /api/stops
export interface NeonRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color?: string;
  route_text_color?: string;
  direction_id: number;
  stop_count: number;
  duration_sec: number;
  fare_inr?: number;
}

export interface NeonStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_sequence?: number;
  distance_m?: number;
}

export interface BusArrival {
  route_id: string;
  route_code: string;
  route_name: string;
  vehicle_id: string;
  eta_seconds: number;
  occupancy_band: OccupancyBand;
  direction: 'outbound' | 'inbound';
}

// Fault injection payloads
export interface DelayRequest { seconds: number }
export interface DropoutRequest { duration_s: number }
export interface CrowdSpikeRequest { band: string; duration_s: number }

// Simulator vehicle telemetry (from GET /vehicles)
export interface VehicleTelemetry {
  vehicle_id: string;
  block_id: string;
  trip_id: string;
  route_id: string;
  direction: 'outbound' | 'inbound';
  leg_state: LegState;
  timestamp: string;
  lat: number;
  lon: number;
  bearing_deg: number;
  speed_kmh: number;
  distance_covered_m: number;
  leg_total_distance_m: number;
  percent_leg_complete: number;
  eta_leg_end_s: number | null;
  dwell_remaining_s: number | null;
  hold_remaining_s: number;
  schedule_deviation_s: number;
  gnss_fix: boolean;
  gnss_dropout_remaining_s: number;
  occupancy_band: string;
  crowd_spike_active: boolean;
}

export interface EventLogEntry {
  ts: string;
  event: string;
  delta_sec: number;
}
