// packages/shared/hooks/useNeonRoutes.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { NeonRoute, NeonStop, BusArrival } from '../lib/types';
import { API_BASE_URL } from '../lib/constants';

interface RoutesApiResponse {
  routes?: NeonRoute[];
  total?: number;
  page?: number;
  pages?: number;
  totalPages?: number;
}

interface StopsApiResponse {
  stops?: NeonStop[];
}

interface NearbyStopsApiResponse {
  stops?: (NeonStop & { buses?: BusArrival[] })[];
}

export type NearbyStopItem = NeonStop & { buses?: BusArrival[] };

export interface UseNeonRoutesResult {
  routes: NeonRoute[];
  totalRoutes: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  searchResults: NeonRoute[];
  stopSearchResults: NeonStop[];
  nearbyStops: NearbyStopItem[];
  nearbyLoading: boolean;
  stopsCache: Record<string, NeonStop[]>;
  fetchRoutes: (page?: number, limit?: number) => Promise<void>;
  fetchStopsForRoute: (routeId: string, direction?: number) => Promise<NeonStop[]>;
  searchRoutes: (query: string) => Promise<NeonRoute[]>;
  searchStops: (query: string) => Promise<NeonStop[]>;
  fetchNearbyStops: (lat: number, lon: number, limit?: number) => Promise<NearbyStopItem[]>;
}

export function useNeonRoutes(): UseNeonRoutesResult {
  const [routes, setRoutes] = useState<NeonRoute[]>([]);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<NeonRoute[]>([]);
  const [stopSearchResults, setStopSearchResults] = useState<NeonStop[]>([]);
  const [nearbyStops, setNearbyStops] = useState<NearbyStopItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const stopsCache = useRef<Record<string, NeonStop[]>>({});

  // Fetch paginated routes
  const fetchRoutes = useCallback(async (page: number = 1, limit: number = 50): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes?page=${page}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch routes: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as RoutesApiResponse;
      if (data.routes) {
        setRoutes(data.routes);
        setTotalRoutes(data.total ?? 0);
        setCurrentPage(data.page ?? 1);
        setTotalPages(data.pages ?? data.totalPages ?? 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch routes';
      console.error('[useNeonRoutes] Failed to fetch routes:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stops for a specific route (with optional direction=0 or 1)
  const fetchStopsForRoute = useCallback(async (routeId: string, direction?: number): Promise<NeonStop[]> => {
    const cacheKey = direction !== undefined ? `${routeId}-d${direction}` : routeId;
    if (stopsCache.current[cacheKey]) {
      return stopsCache.current[cacheKey];
    }
    try {
      const encodedId = encodeURIComponent(routeId);
      const url = direction !== undefined
        ? `${API_BASE_URL}/api/routes/${encodedId}/stops?direction=${direction}`
        : `${API_BASE_URL}/api/routes/${encodedId}/stops`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch stops: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as StopsApiResponse;
      const stops: NeonStop[] = data.stops || [];
      stopsCache.current[cacheKey] = stops;
      return stops;
    } catch (err) {
      console.error(`[useNeonRoutes] Failed to fetch stops for route ${routeId}:`, err);
      return [];
    }
  }, []);

  // Search routes
  const searchRoutes = useCallback(async (query: string): Promise<NeonRoute[]> => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes/search?q=${encodeURIComponent(query)}&limit=20`);
      if (!res.ok) {
        throw new Error(`Failed to search routes: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as RoutesApiResponse;
      const results = data.routes || [];
      setSearchResults(results);
      return results;
    } catch (err) {
      console.error('[useNeonRoutes] Search failed:', err);
      setSearchResults([]);
      return [];
    }
  }, []);

  // Search stops
  const searchStops = useCallback(async (query: string): Promise<NeonStop[]> => {
    if (!query.trim()) {
      setStopSearchResults([]);
      return [];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/stops/search?q=${encodeURIComponent(query)}&limit=20`);
      if (!res.ok) {
        throw new Error(`Failed to search stops: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as StopsApiResponse;
      const results = data.stops || [];
      setStopSearchResults(results);
      return results;
    } catch (err) {
      console.error('[useNeonRoutes] Stop search failed:', err);
      setStopSearchResults([]);
      return [];
    }
  }, []);

  // Fetch nearby stops based on GPS coordinates
  const fetchNearbyStops = useCallback(async (lat: number, lon: number, limit: number = 5): Promise<NearbyStopItem[]> => {
    setNearbyLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stops/nearby?lat=${lat}&lon=${lon}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch nearby stops: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as NearbyStopsApiResponse;
      const stops: NearbyStopItem[] = data.stops || [];
      setNearbyStops(stops);
      return stops;
    } catch (err) {
      console.error('[useNeonRoutes] Nearby stops fetch failed:', err);
      setNearbyStops([]);
      return [];
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  // Load initial routes on mount
  useEffect(() => {
    fetchRoutes(1, 50);
  }, [fetchRoutes]);

  return {
    routes,
    totalRoutes,
    currentPage,
    totalPages,
    isLoading,
    loading: isLoading,
    error,
    searchResults,
    stopSearchResults,
    nearbyStops,
    nearbyLoading,
    stopsCache: stopsCache.current,
    fetchRoutes,
    fetchStopsForRoute,
    searchRoutes,
    searchStops,
    fetchNearbyStops,
  };
}
