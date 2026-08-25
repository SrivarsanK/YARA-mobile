// packages/user-app/src/screens/RoutesScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Star,
  ShieldCheck,
  Bus,
  Search,
} from 'lucide-react-native';
import {
  RouteCard,
  EmptyState,
  LoadingShimmer,
  AGENCY_PRESETS,
  colors,
  NeonRoute,
} from '@yara/shared';
import { useRoutes } from '../context/RoutesContext';
import { ScreenNavigationProp } from '../navigation/types';

export const RoutesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const {
    routes,
    totalPages,
    currentPage,
    isLoading,
    error,
    fetchRoutes,
  } = useRoutes();

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchingNextPage, setFetchingNextPage] = useState<boolean>(false);

  // Filter routes based on selected agency chip
  const filteredRoutes = useMemo(() => {
    if (selectedAgencyId === 'all') {
      return routes;
    }
    const preset = AGENCY_PRESETS.find((a) => a.id === selectedAgencyId);
    if (!preset) return routes;

    return routes.filter((r) => {
      const code = r.route_short_name.toUpperCase();
      return preset.routes.some(
        (pr) => code === pr.toUpperCase() || code.startsWith(pr.toUpperCase())
      );
    });
  }, [routes, selectedAgencyId]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRoutes(1);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRoutes]);

  // Infinite scroll pagination
  const handleEndReached = useCallback(async () => {
    if (isLoading || fetchingNextPage || currentPage >= totalPages) {
      return;
    }
    setFetchingNextPage(true);
    try {
      await fetchRoutes(currentPage + 1);
    } finally {
      setFetchingNextPage(false);
    }
  }, [isLoading, fetchingNextPage, currentPage, totalPages, fetchRoutes]);

  const handleSelectRoute = useCallback(
    (route: NeonRoute) => {
      navigation.navigate('RouteDetail', {
        routeId: route.route_id,
        directionId: route.direction_id,
      });
    },
    [navigation]
  );

  const agencyFilterOptions = useMemo(() => {
    return [
      { id: 'all', label: 'All Agencies', count: routes.length },
      ...AGENCY_PRESETS.map((agency) => ({
        id: agency.id,
        label: agency.shortName,
        count: agency.routes.length,
      })),
    ];
  }, [routes.length]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar Title */}
      <View style={styles.topHeader}>
        <View style={styles.titleSection}>
          <View style={styles.badgeRow}>
            <View style={styles.agencyBadge}>
              <Text style={styles.agencyBadgeText}>MTC CHENNAI</Text>
            </View>
            <View style={styles.activePill}>
              <Star size={12} color="#B17816" fill="#F7A501" />
              <Text style={styles.activePillText}>
                {routes.length || 0} Routes
              </Text>
            </View>
          </View>
          <Text style={styles.screenTitle}>Transit Routes</Text>
          <Text style={styles.screenSubtitle}>
            Browse active urban bus corridors and scheduled runs
          </Text>
        </View>

        <TouchableOpacity
          style={styles.searchQuickBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
          accessibilityLabel="Open Transit Search"
        >
          <Search size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* GTFS Feed Verified Card */}
      <View style={styles.feedCard}>
        <View style={styles.feedCardLeft}>
          <View style={styles.feedIconBox}>
            <ShieldCheck size={20} color="#B17816" />
          </View>
          <View style={styles.feedCardText}>
            <Text style={styles.feedCardTitle}>GTFS Feed Verified</Text>
            <Text style={styles.feedCardSubtitle}>
              Chennai Metropolitan Transit Authority
            </Text>
          </View>
        </View>
        <View style={styles.streamBadge}>
          <View style={styles.streamDot} />
          <Text style={styles.streamBadgeText}>Active Stream</Text>
        </View>
      </View>

      {/* Agency Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {agencyFilterOptions.map((opt) => {
            const isSelected = selectedAgencyId === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.75}
                onPress={() => setSelectedAgencyId(opt.id)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <Bus
                  size={13}
                  color={isSelected ? '#1C1400' : colors.text.muted}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                <View
                  style={[
                    styles.chipCountBadge,
                    isSelected && styles.chipCountBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      isSelected && styles.chipCountTextSelected,
                    ]}
                  >
                    {opt.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Section Subheader */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Routes</Text>
        <Text style={styles.sectionCount}>
          Showing {filteredRoutes.length} of {routes.length}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredRoutes}
        keyExtractor={(item) =>
          item.route_id || `${item.route_short_name}-${item.direction_id}`
        }
        renderItem={({ item }) => (
          <RouteCard route={item} onPress={() => handleSelectRoute(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          (isLoading || fetchingNextPage) && routes.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#B17816" />
              <Text style={styles.footerLoaderText}>Loading more routes...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading && routes.length === 0 ? (
            <View style={styles.shimmerContainer}>
              <LoadingShimmer rows={6} />
            </View>
          ) : (
            <EmptyState
              icon="route"
              title="No routes found"
              message={
                error
                  ? error
                  : 'No active transit corridors match your selected agency filter.'
              }
            />
          )
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#B17816"
            colors={['#B17816']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  headerContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 14,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  agencyBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  agencyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  searchQuickBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  feedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  feedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCardText: {
    flex: 1,
  },
  feedCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  feedCardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.muted,
  },
  streamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  streamBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  filterSection: {
    marginTop: 2,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#F7A501',
    borderColor: '#D97706',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  filterChipTextSelected: {
    color: '#1C1400',
    fontWeight: '800',
  },
  chipCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  chipCountBadgeSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  chipCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
  },
  chipCountTextSelected: {
    color: '#1C1400',
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  separator: {
    height: 10,
  },
  shimmerContainer: {
    paddingTop: 8,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  footerLoaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
