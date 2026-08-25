// packages/user-app/src/screens/SearchScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Bus,
  MapPin,
  Clock,
  Star,
  Flag,
  Navigation as NavigationIcon,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import {
  RouteCard,
  StopCard,
  SearchInput,
  EmptyState,
  LoadingShimmer,
  useDebounce,
  colors,
  NeonRoute,
  NeonStop,
  AGENCY_PRESETS,
  S26_CORRIDOR_STOPS,
} from '@yara/shared';
import { useRoutes } from '../context/RoutesContext';
import { ScreenNavigationProp } from '../navigation/types';

type SearchFilter = 'all' | 'routes' | 'stops';

interface AutocompleteItem {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lon: number;
  type: 'stop' | 'route' | 'place';
  routeId?: string;
}

export const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const {
    routes,
    searchRoutes,
    searchStops,
    searchResults,
    stopSearchResults,
    nearbyStops,
  } = useRoutes();

  const [query, setQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [routeMatches, setRouteMatches] = useState<NeonRoute[]>([]);
  const [stopMatches, setStopMatches] = useState<NeonStop[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Perform search whenever debounced query changes
  useEffect(() => {
    let isCurrent = true;

    const executeSearch = async () => {
      const trimmed = debouncedQuery.trim();
      if (!trimmed || trimmed.length < 1) {
        setRouteMatches([]);
        setStopMatches([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const [rResults, sResults] = await Promise.all([
          searchRoutes(trimmed),
          searchStops(trimmed),
        ]);

        if (isCurrent) {
          // If server search returned results, use them; otherwise fallback to local filtering
          if (rResults && rResults.length > 0) {
            setRouteMatches(rResults);
          } else {
            const qLower = trimmed.toLowerCase();
            const localRoutes = routes.filter(
              (r) =>
                r.route_short_name.toLowerCase().includes(qLower) ||
                r.route_long_name.toLowerCase().includes(qLower)
            );
            setRouteMatches(localRoutes);
          }

          if (sResults && sResults.length > 0) {
            setStopMatches(sResults);
          } else {
            const qLower = trimmed.toLowerCase();
            const localStops: NeonStop[] = S26_CORRIDOR_STOPS.filter((s) =>
              s.name.toLowerCase().includes(qLower)
            ).map((s, idx) => ({
              stop_id: s.id,
              stop_name: s.name,
              stop_lat: s.lat,
              stop_lon: s.lon,
              stop_sequence: idx + 1,
            }));
            setStopMatches(localStops);
          }
        }
      } catch (err) {
        console.error('[SearchScreen] Search execution failed:', err);
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    };

    executeSearch();

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, searchRoutes, searchStops, routes]);

  // Autocomplete fast suggestions while typing
  const autocompleteSuggestions = useMemo((): AutocompleteItem[] => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    const suggestions: AutocompleteItem[] = [];

    // Match stops
    S26_CORRIDOR_STOPS.forEach((stop) => {
      if (stop.name.toLowerCase().includes(trimmed)) {
        suggestions.push({
          id: `ac-stop-${stop.id}`,
          name: stop.name,
          sub: 'Chennai MTC · Stop',
          lat: stop.lat,
          lon: stop.lon,
          type: 'stop',
        });
      }
    });

    // Match routes
    routes.forEach((r) => {
      if (
        r.route_short_name.toLowerCase().includes(trimmed) ||
        r.route_long_name.toLowerCase().includes(trimmed)
      ) {
        suggestions.push({
          id: `ac-route-${r.route_id}`,
          name: `Bus ${r.route_short_name}`,
          sub: r.route_long_name,
          lat: 13.0302,
          lon: 80.1806,
          type: 'route',
          routeId: r.route_id,
        });
      }
    });

    return suggestions.slice(0, 5);
  }, [query, routes]);

  const handleSelectRoute = useCallback(
    (routeId: string, directionId: number = 0) => {
      navigation.navigate('RouteDetail', {
        routeId,
        directionId,
      });
    },
    [navigation]
  );

  const handleSelectStop = useCallback(
    (stopName: string) => {
      setQuery(stopName);
    },
    []
  );

  // Default suggestions data (when query is empty)
  const defaultRecentRoutes = useMemo(() => {
    if (routes.length > 0) return routes.slice(0, 3);
    return [
      {
        route_id: '13311',
        route_short_name: 'S26',
        route_long_name: 'Ashok Pillar TO Valasaravakkam',
        route_type: 3,
        direction_id: 0,
        stop_count: 19,
        duration_sec: 1500,
        fare_inr: 15,
      },
      {
        route_id: '16917',
        route_short_name: '21G',
        route_long_name: 'Broadway TO Tambaram',
        route_type: 3,
        direction_id: 0,
        stop_count: 32,
        duration_sec: 2400,
        fare_inr: 25,
      },
      {
        route_id: '15421',
        route_short_name: '570',
        route_long_name: 'Koyambedu TO Kelambakkam',
        route_type: 3,
        direction_id: 0,
        stop_count: 45,
        duration_sec: 3600,
        fare_inr: 35,
      },
    ];
  }, [routes]);

  const defaultRecentStops: NeonStop[] = useMemo(() => {
    if (nearbyStops.length > 0) {
      return nearbyStops.slice(0, 4);
    }
    return S26_CORRIDOR_STOPS.slice(0, 4).map((s, idx) => ({
      stop_id: s.id,
      stop_name: s.name,
      stop_lat: s.lat,
      stop_lon: s.lon,
      distance_m: (idx + 1) * 220,
    }));
  }, [nearbyStops]);

  const defaultKeyPlaces = useMemo(
    () => [
      {
        name: 'Ashok Pillar Terminal',
        sub: 'Chennai Central Hub',
        routeId: '13311',
      },
      {
        name: 'Valasaravakkam Terminus',
        sub: 'West Chennai Corridor',
        routeId: '13311',
      },
      {
        name: 'Koyambedu CMBT',
        sub: 'Intercity Bus Terminal',
        routeId: '15421',
      },
      {
        name: 'Guindy Railway Station',
        sub: 'Multi-Modal Interchange',
        routeId: '16917',
      },
    ],
    []
  );

  const filterTabs: Array<{ id: SearchFilter; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All Suggestions', icon: <Zap size={14} color={activeFilter === 'all' ? '#1C1400' : colors.text.muted} /> },
    { id: 'routes', label: 'Bus Routes', icon: <Bus size={14} color={activeFilter === 'routes' ? '#1C1400' : colors.text.muted} /> },
    { id: 'stops', label: 'Stops & Stations', icon: <MapPin size={14} color={activeFilter === 'stops' ? '#1C1400' : colors.text.muted} /> },
  ];

  // Render when query is empty
  const renderDefaultView = () => (
    <View style={styles.defaultContainer}>
      {/* Recent Routes Section */}
      {(activeFilter === 'all' || activeFilter === 'routes') && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Clock size={16} color="#B17816" />
              <Text style={styles.sectionHeaderTitle}>POPULAR ROUTES</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Routes')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemsList}>
            {defaultRecentRoutes.map((r) => (
              <RouteCard
                key={r.route_id}
                route={r}
                onPress={() => handleSelectRoute(r.route_id, r.direction_id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Frequent & Nearby Stops Section */}
      {(activeFilter === 'all' || activeFilter === 'stops') && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Star size={16} color="#B17816" />
              <Text style={styles.sectionHeaderTitle}>FREQUENT BUS STOPS</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {defaultRecentStops.map((stop) => (
              <StopCard
                key={stop.stop_id}
                stop={stop}
                busList={['S26', '21G', '570']}
                onPress={() => handleSelectStop(stop.stop_name)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Terminals & Key Places Section */}
      {activeFilter === 'all' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Flag size={16} color="#B17816" />
              <Text style={styles.sectionHeaderTitle}>TERMINALS & KEY PLACES</Text>
            </View>
          </View>

          <View style={styles.placesGrid}>
            {defaultKeyPlaces.map((place, idx) => (
              <TouchableOpacity
                key={`place-${idx}`}
                style={styles.placeCard}
                activeOpacity={0.8}
                onPress={() => handleSelectRoute(place.routeId)}
              >
                <View style={styles.placeAvatar}>
                  <Text style={styles.placeAvatarText}>
                    {place.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <Text style={styles.placeSub} numberOfLines={1}>
                    {place.sub}
                  </Text>
                </View>
                <NavigationIcon size={14} color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // Render when query is non-empty
  const renderResultsView = () => {
    const showRoutes = activeFilter === 'all' || activeFilter === 'routes';
    const showStops = activeFilter === 'all' || activeFilter === 'stops';

    const displayedRoutes = showRoutes ? routeMatches : [];
    const displayedStops = showStops ? stopMatches : [];
    const totalResults = displayedRoutes.length + displayedStops.length;

    if (isSearching) {
      return (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.resultsSubtitle}>
              Searching transit network...
            </Text>
            <ActivityIndicator size="small" color="#B17816" />
          </View>
          <LoadingShimmer rows={4} />
        </View>
      );
    }

    if (totalResults === 0) {
      return (
        <View style={styles.resultsContainer}>
          <EmptyState
            icon="search"
            title="No routes or stops found"
            message={`No results matching "${query}". Try searching by route number (e.g. S26, 21G) or stop name.`}
          />
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        {/* Results Header */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsTitle}>
            Results for "{query}"
          </Text>
          <Text style={styles.resultsCount}>
            {totalResults} matches found
          </Text>
        </View>

        {/* Matching Routes */}
        {displayedRoutes.length > 0 && (
          <View style={styles.resultsGroup}>
            <View style={styles.groupHeader}>
              <Bus size={15} color="#B17816" />
              <Text style={styles.groupTitle}>
                BUS ROUTES ({displayedRoutes.length})
              </Text>
            </View>
            <View style={styles.itemsList}>
              {displayedRoutes.map((route) => (
                <RouteCard
                  key={`r-match-${route.route_id}`}
                  route={route}
                  onPress={() =>
                    handleSelectRoute(route.route_id, route.direction_id)
                  }
                />
              ))}
            </View>
          </View>
        )}

        {/* Matching Stops */}
        {displayedStops.length > 0 && (
          <View style={styles.resultsGroup}>
            <View style={styles.groupHeader}>
              <MapPin size={15} color="#2563EB" />
              <Text style={styles.groupTitle}>
                STOPS & STATIONS ({displayedStops.length})
              </Text>
            </View>
            <View style={styles.itemsList}>
              {displayedStops.map((stop) => (
                <StopCard
                  key={`s-match-${stop.stop_id}`}
                  stop={stop}
                  onPress={() => handleSelectRoute('13311')}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Search Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleIconBox}>
            <Search size={18} color="#B17816" />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.mainTitle}>Transit Search</Text>
            <Text style={styles.mainSubtitle}>
              Chennai MTC Multi-Modal Network
            </Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Search Input Box */}
        <View style={styles.searchBoxWrapper}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search bus code (e.g. S26, 21G), stop or destination..."
          />
        </View>

        {/* Segment Filter Toggle Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsRow}
        >
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.75}
                onPress={() => setActiveFilter(tab.id)}
                style={[
                  styles.filterTab,
                  isSelected && styles.filterTabSelected,
                ]}
              >
                {tab.icon}
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextSelected,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Autocomplete Dropdown suggestions while typing */}
      {query.length >= 2 && autocompleteSuggestions.length > 0 && (
        <View style={styles.autocompleteCard}>
          {autocompleteSuggestions.map((item, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              style={[
                styles.autocompleteRow,
                idx === autocompleteSuggestions.length - 1 &&
                  styles.autocompleteRowLast,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.type === 'route' && item.routeId) {
                  handleSelectRoute(item.routeId);
                } else {
                  handleSelectStop(item.name);
                }
              }}
            >
              <View style={styles.autocompleteLeft}>
                <View
                  style={[
                    styles.autocompleteIconBox,
                    item.type === 'route'
                      ? styles.acIconRoute
                      : styles.acIconStop,
                  ]}
                >
                  {item.type === 'route' ? (
                    <Bus size={14} color="#B17816" />
                  ) : (
                    <MapPin size={14} color="#2563EB" />
                  )}
                </View>
                <View style={styles.autocompleteText}>
                  <Text style={styles.acName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.acSub} numberOfLines={1}>
                    {item.sub}
                  </Text>
                </View>
              </View>
              <Text style={styles.acCoords}>
                {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim().length === 0
          ? renderDefaultView()
          : renderResultsView()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  mainSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  searchBoxWrapper: {
    width: '100%',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabSelected: {
    backgroundColor: '#F7A501',
    borderColor: '#D97706',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  filterTabTextSelected: {
    color: '#1C1400',
    fontWeight: '800',
  },
  autocompleteCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  autocompleteRowLast: {
    borderBottomWidth: 0,
  },
  autocompleteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  autocompleteIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  acIconRoute: {
    backgroundColor: '#FEF3C7',
  },
  acIconStop: {
    backgroundColor: '#EFF6FF',
  },
  autocompleteText: {
    flex: 1,
    minWidth: 0,
  },
  acName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  acSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.muted,
  },
  acCoords: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.text.muted,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 96,
  },
  defaultContainer: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B17816',
  },
  itemsList: {
    gap: 10,
  },
  placesGrid: {
    gap: 8,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  placeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  placeAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.muted,
  },
  resultsContainer: {
    gap: 14,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  resultsSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  resultsGroup: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
});
