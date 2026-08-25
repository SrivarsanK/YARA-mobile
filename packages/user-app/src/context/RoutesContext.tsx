import React, { createContext, useContext, ReactNode, useRef, useState, useCallback } from 'react';
import { NeonRoute, NeonStop, BusArrival } from '@yara/shared';

interface RoutesContextValue {
  routes: NeonRoute[];
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  stopsCache: Record<string, NeonStop[]>;
  nearbyStops: (NeonStop & { buses: BusArrival[] })[];
  fetchRoutes: (page: number) => Promise<void>;
  searchRoutes: (q: string) => Promise<NeonRoute[]>;
  fetchStopsForRoute: (routeId: string, directionId: number) => Promise<NeonStop[]>;
  searchStops: (q: string) => Promise<NeonStop[]>;
  fetchNearbyStops: (lat: number, lon: number, limit?: number) => Promise<void>;
}

const RoutesContext = createContext<RoutesContextValue | null>(null);

interface RoutesProviderProps {
  children: ReactNode;
}

export const RoutesProvider: React.FC<RoutesProviderProps> = ({ children }) => {
  const [routes, setRoutes] = useState<NeonRoute[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopsCache = useRef<Record<string, NeonStop[]>>({});
  const [nearbyStops, setNearbyStops] = useState<(NeonStop & { buses: BusArrival[] })[]>([]);

  const fetchRoutes = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      // Phase 3: wire useNeonRoutes hook here
      console.log('[RoutesContext] fetchRoutes stub called for page', page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchRoutes = useCallback(async (_q: string): Promise<NeonRoute[]> => {
    console.log('[RoutesContext] searchRoutes stub called');
    return [];
  }, []);

  const fetchStopsForRoute = useCallback(async (_routeId: string, _directionId: number): Promise<NeonStop[]> => {
    console.log('[RoutesContext] fetchStopsForRoute stub called');
    return [];
  }, []);

  const searchStops = useCallback(async (_q: string): Promise<NeonStop[]> => {
    console.log('[RoutesContext] searchStops stub called');
    return [];
  }, []);

  const fetchNearbyStops = useCallback(async (_lat: number, _lon: number, _limit = 5) => {
    console.log('[RoutesContext] fetchNearbyStops stub called');
  }, []);

  const value: RoutesContextValue = {
    routes,
    totalPages,
    currentPage,
    loading,
    error,
    stopsCache: stopsCache.current,
    nearbyStops,
    fetchRoutes,
    searchRoutes,
    fetchStopsForRoute,
    searchStops,
    fetchNearbyStops,
  };

  return <RoutesContext.Provider value={value}>{children}</RoutesContext.Provider>;
};

export const useRoutesContext = (): RoutesContextValue => {
  const context = useContext(RoutesContext);
  if (!context) {
    throw new Error('useRoutesContext must be used within a RoutesProvider');
  }
  return context;
};
