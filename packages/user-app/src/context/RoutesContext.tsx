import React, {
  createContext,
  useContext,
  ReactNode,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  NeonRoute,
  NeonStop,
  NearbyStopItem,
  LocationResult,
  useNeonRoutes,
  useLocation,
} from '@yara/shared';

export interface RoutesContextValue {
  // Core contract required by Worker A & specifications
  routes: NeonRoute[];
  totalPages: number;
  fetchRoutes: (page?: number, limit?: number) => Promise<void>;
  searchRoutes: (q: string) => Promise<NeonRoute[]>;
  fetchStopsForRoute: (routeId: string, direction?: number) => Promise<NeonStop[]>;
  searchStops: (q: string) => Promise<NeonStop[]>;
  fetchNearbyStops: (lat: number, lon: number, limit?: number) => Promise<NearbyStopItem[]>;
  nearbyStops: NearbyStopItem[];
  stopsCache: Record<string, NeonStop[]>;

  // Additional helper states
  currentPage: number;
  totalRoutes: number;
  loading: boolean;
  isLoading: boolean;
  loadingRoutes: boolean;
  error: string | null;
  searchResults: NeonRoute[];
  stopSearchResults: NeonStop[];
  nearbyLoading: boolean;
  userLocation: LocationResult;
}

const RoutesContext = createContext<RoutesContextValue | null>(null);

interface RoutesProviderProps {
  children: ReactNode;
}

export const RoutesProvider: React.FC<RoutesProviderProps> = ({ children }) => {
  const neon = useNeonRoutes();
  const location = useLocation();

  // Manage accumulated paginated routes
  const [accumulatedRoutes, setAccumulatedRoutes] = useState<NeonRoute[]>([]);
  const stopsCache = useRef<Record<string, NeonStop[]>>({});
  const autoFetchedLocationRef = useRef<string | null>(null);

  // Sync accumulated routes with neon.routes on page changes
  useEffect(() => {
    if (neon.currentPage === 1) {
      setAccumulatedRoutes(neon.routes);
    } else if (neon.routes.length > 0) {
      setAccumulatedRoutes((prev) => {
        const existingIds = new Set(prev.map((r) => r.route_id));
        const newRoutes = neon.routes.filter((r) => !existingIds.has(r.route_id));
        return [...prev, ...newRoutes];
      });
    }
  }, [neon.routes, neon.currentPage]);

  // GPS auto-fetch nearby stops once coordinates become available
  useEffect(() => {
    if (location.lat !== null && location.lon !== null) {
      const locKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
      if (autoFetchedLocationRef.current !== locKey) {
        autoFetchedLocationRef.current = locKey;
        neon.fetchNearbyStops(location.lat, location.lon);
      }
    }
  }, [location.lat, location.lon, neon.fetchNearbyStops]);

  // Fetch paginated routes
  const fetchRoutes = useCallback(
    async (page: number = 1, limit: number = 50): Promise<void> => {
      await neon.fetchRoutes(page, limit);
    },
    [neon.fetchRoutes]
  );

  // Search routes
  const searchRoutes = useCallback(
    async (q: string): Promise<NeonRoute[]> => {
      return await neon.searchRoutes(q);
    },
    [neon.searchRoutes]
  );

  // Fetch stops for a specific route with caching
  const fetchStopsForRoute = useCallback(
    async (routeId: string, direction?: number): Promise<NeonStop[]> => {
      const cacheKey = direction !== undefined ? `${routeId}-d${direction}` : routeId;
      if (stopsCache.current[cacheKey] && stopsCache.current[cacheKey].length > 0) {
        return stopsCache.current[cacheKey];
      }
      const stops = await neon.fetchStopsForRoute(routeId, direction);
      if (stops && stops.length > 0) {
        stopsCache.current[cacheKey] = stops;
      }
      return stops;
    },
    [neon.fetchStopsForRoute]
  );

  // Search stops
  const searchStops = useCallback(
    async (q: string): Promise<NeonStop[]> => {
      return await neon.searchStops(q);
    },
    [neon.searchStops]
  );

  // Fetch nearby stops
  const fetchNearbyStops = useCallback(
    async (lat: number, lon: number, limit: number = 5): Promise<NearbyStopItem[]> => {
      return await neon.fetchNearbyStops(lat, lon, limit);
    },
    [neon.fetchNearbyStops]
  );

  const value: RoutesContextValue = {
    // Core contract
    routes: accumulatedRoutes.length > 0 ? accumulatedRoutes : neon.routes,
    totalPages: neon.totalPages,
    fetchRoutes,
    searchRoutes,
    fetchStopsForRoute,
    searchStops,
    fetchNearbyStops,
    nearbyStops: neon.nearbyStops,
    stopsCache: stopsCache.current,

    // Helper states
    currentPage: neon.currentPage,
    totalRoutes: neon.totalRoutes,
    loading: neon.isLoading,
    isLoading: neon.isLoading,
    loadingRoutes: neon.isLoading,
    error: neon.error,
    searchResults: neon.searchResults,
    stopSearchResults: neon.stopSearchResults,
    nearbyLoading: neon.nearbyLoading,
    userLocation: location,
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

export const useRoutes = useRoutesContext;
