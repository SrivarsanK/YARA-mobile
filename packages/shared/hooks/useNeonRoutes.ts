// packages/shared/hooks/useNeonRoutes.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { NeonRoute, NeonStop, BusArrival } from '../lib/types';
import { getRoutes, getRouteStops, getNearbyStops, searchRoutes as apiSearchRoutes, searchStops as apiSearchStops } from '../services/api';

export interface NearbyStopResult {
  stop: NeonStop;
  distance_m: number;
  arrivals: BusArrival[];
}

export interface UseNeonRoutesReturn {
  routes: NeonRoute[];
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchRoutes: (page?: number) => Promise<NeonRoute[]>;
  searchRoutes: (q: string) => Promise<NeonRoute[]>;
  fetchStopsForRoute: (id: string, directionId?: number) => Promise<NeonStop[]>;
  searchStops: (q: string) => Promise<NeonStop[]>;
  fetchNearbyStops: (lat: number, lon: number, limit?: number) => Promise<NearbyStopResult[]>;
  nearbyStops: NearbyStopResult[];
  stopsCache: Record<string, NeonStop[]>;
}

export function useNeonRoutes(): UseNeonRoutesReturn {
  const [routes, setRoutes] = useState<NeonRoute[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyStops, setNearbyStops] = useState<NearbyStopResult[]>([]);
  const stopsCacheRef = useRef<Record<string, NeonStop[]>>({});

  const fetchRoutes = useCallback(async (page: number = 1): Promise<NeonRoute[]> => {
    setLoading(true);
    try {
      const res = await getRoutes(page);
      setRoutes(res.routes);
      setTotalPages(res.totalPages);
      setLoading(false);
      return res.routes;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching routes');
      setLoading(false);
      return [];
    }
  }, []);

  const searchRoutes = useCallback(async (q: string): Promise<NeonRoute[]> => {
    try {
      return await apiSearchRoutes(q);
    } catch (err) {
      return [];
    }
  }, []);

  const fetchStopsForRoute = useCallback(async (id: string, directionId: number = 0): Promise<NeonStop[]> => {
    const key = `${id}_${directionId}`;
    if (stopsCacheRef.current[key]) {
      return stopsCacheRef.current[key];
    }
    try {
      const stops = await getRouteStops(id, directionId);
      stopsCacheRef.current[key] = stops;
      return stops;
    } catch (err) {
      return [];
    }
  }, []);

  const searchStops = useCallback(async (q: string): Promise<NeonStop[]> => {
    try {
      return await apiSearchStops(q);
    } catch (err) {
      return [];
    }
  }, []);

  const fetchNearbyStops = useCallback(async (lat: number, lon: number, limit: number = 5): Promise<NearbyStopResult[]> => {
    try {
      const stops = await getNearbyStops(lat, lon, limit);
      setNearbyStops(stops);
      return stops;
    } catch (err) {
      return [];
    }
  }, []);

  return {
    routes,
    totalPages,
    loading,
    error,
    fetchRoutes,
    searchRoutes,
    fetchStopsForRoute,
    searchStops,
    fetchNearbyStops,
    nearbyStops,
    stopsCache: stopsCacheRef.current,
  };
}
