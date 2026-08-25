// packages/shared/lib/constants.ts
// Mirror of Python shared/constants.py — LOCKED

// Backend URLs — set via environment variables
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.100:8002';
export const SIM_BASE_URL = process.env.EXPO_PUBLIC_SIM_URL ?? 'http://192.168.1.100:8001';

// Transit constants (from shared/constants.py)
export const BLOCK_ID = 'block_001';
export const BUS_CAPACITY = 40;       // seated
export const BUS_MAX_CAPACITY = 55;   // absolute max
export const OUTBOUND_TOTAL_SEC = 1500;  // 25 * 60
export const INBOUND_TOTAL_SEC = 1500;   // 25 * 60
export const DWELL_BASELINE_SEC = 300;
export const DWELL_RECOVERY_FACTOR = 0.3;
export const DWELL_MINIMUM_SEC = 60;
export const BAND_MODERATE_RATIO = 1.2;

// SSE
export const SSE_RECONNECT_DELAY_MS = 3000;
export const SSE_MAX_RECONNECT_ATTEMPTS = 5;
