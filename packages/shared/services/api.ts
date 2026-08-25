// packages/shared/services/api.ts — REST client for all CH-3 + CH-1 endpoints
import { API_BASE_URL, SIM_BASE_URL } from "../lib/constants";
import type { NeonRoute, NeonStop, BusArrival, VehicleTelemetry, DelayRequest, DropoutRequest, CrowdSpikeRequest } from "../lib/types";

const jsonHeaders = { "Content-Type": "application/json" };

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: jsonHeaders, ...options });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// CH-3 ETA Engine
export async function getETA(): Promise<any> {
  return fetchJson(`${API_BASE_URL}/eta`);
}

export async function getRoutes(page = 1, limit = 50): Promise<{ routes: NeonRoute[]; total: number; page: number; totalPages: number }> {
  return fetchJson(`${API_BASE_URL}/api/routes?page=${page}&limit=${limit}`);
}

export async function searchRoutes(q: string): Promise<NeonRoute[]> {
  return fetchJson(`${API_BASE_URL}/api/routes/search?q=${encodeURIComponent(q)}`);
}

export async function getRouteStops(routeId: string, direction = 0): Promise<NeonStop[]> {
  return fetchJson(`${API_BASE_URL}/api/routes/${routeId}/stops?direction=${direction}`);
}

export async function searchStops(q: string): Promise<NeonStop[]> {
  return fetchJson(`${API_BASE_URL}/api/stops/search?q=${encodeURIComponent(q)}`);
}

export async function getNearbyStops(lat: number, lon: number, limit = 5): Promise<{ stop: NeonStop; distance_m: number; arrivals: BusArrival[] }[]> {
  return fetchJson(`${API_BASE_URL}/api/stops/nearby?lat=${lat}&lon=${lon}&limit=${limit}`);
}

export async function getModelInfo(): Promise<any> {
  return fetchJson(`${API_BASE_URL}/model/info`);
}

export async function getNetworkStats(): Promise<any> {
  return fetchJson(`${API_BASE_URL}/routes`);
}

// CH-1 Simulator
export async function getSimHealth(): Promise<any> {
  return fetchJson(`${SIM_BASE_URL}/health`);
}

export async function getVehicles(): Promise<VehicleTelemetry[]> {
  return fetchJson(`${SIM_BASE_URL}/vehicles`);
}

export async function getVehicle(id: string): Promise<VehicleTelemetry> {
  return fetchJson(`${SIM_BASE_URL}/vehicles/${id}`);
}

export async function getBlocks(): Promise<any> {
  return fetchJson(`${SIM_BASE_URL}/blocks`);
}

export async function injectDelay(vehicleId: string, body: DelayRequest): Promise<VehicleTelemetry> {
  return fetchJson(`${SIM_BASE_URL}/vehicles/${vehicleId}/delay`, { method: "POST", body: JSON.stringify(body) });
}

export async function injectDropout(vehicleId: string, body: DropoutRequest): Promise<VehicleTelemetry> {
  return fetchJson(`${SIM_BASE_URL}/vehicles/${vehicleId}/gnss-dropout`, { method: "POST", body: JSON.stringify(body) });
}

export async function injectCrowdSpike(vehicleId: string, body: CrowdSpikeRequest): Promise<VehicleTelemetry> {
  return fetchJson(`${SIM_BASE_URL}/vehicles/${vehicleId}/crowd-spike`, { method: "POST", body: JSON.stringify(body) });
}