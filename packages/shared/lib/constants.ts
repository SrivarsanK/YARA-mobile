// packages/shared/lib/constants.ts
// Mirror of Python shared/constants.py — LOCKED

const getDefaultApiUrl = (): string => {
  // On Web browser, always connect to the same host that served the page
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8002`;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://172.16.8.126:8002';
};

const getDefaultSimUrl = (): string => {
  // On Web browser, always connect to the same host that served the page
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8001`;
  }
  if (process.env.EXPO_PUBLIC_SIM_URL) {
    return process.env.EXPO_PUBLIC_SIM_URL;
  }
  return 'http://172.16.8.126:8001';
};

// Backend URLs — dynamically resolve browser host, env, or active LAN IP
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
