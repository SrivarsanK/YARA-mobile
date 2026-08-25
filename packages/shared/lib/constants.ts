// packages/shared/lib/constants.ts
// Mirror of Python shared/constants.py — LOCKED

const getDefaultApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8002`;
  }
  return 'http://192.168.1.12:8002';
};

const getDefaultSimUrl = (): string => {
  if (process.env.EXPO_PUBLIC_SIM_URL) {
    return process.env.EXPO_PUBLIC_SIM_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8001`;
  }
  return 'http://192.168.1.12:8001';
};

// Backend URLs — dynamically resolve env, browser host, or LAN IP
export const API_BASE_URL = getDefaultApiUrl();
export const SIM_BASE_URL = getDefaultSimUrl();

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
