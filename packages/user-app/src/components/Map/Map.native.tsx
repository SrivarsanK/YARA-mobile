// packages/user-app/src/components/Map/Map.native.tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { BusMarker } from '../BusMarker';
import type { MapViewProps } from './types';
import { S26_CORRIDOR_STOPS } from '@yara/shared/lib/agencies';

export const Map: React.FC<MapViewProps> = ({
  vehicleLat,
  vehicleLon,
  vehicleLeg,
  routeCode = 'S26',
  stops = S26_CORRIDOR_STOPS,
  centerLat,
  centerLon,
  userLat,
  userLon,
  latitudeDelta = 0.08,
  longitudeDelta = 0.08,
  onSelectStop,
}) => {
  const mapRef = useRef<MapView>(null);

  // Prefer user GPS, then explicit center, then route start
  const initLat = userLat ?? centerLat ?? stops[0]?.lat ?? 13.0302;
  const initLon = userLon ?? centerLon ?? stops[0]?.lon ?? 80.1806;

  const polylineCoords = stops.map((s) => ({
    latitude: s.lat,
    longitude: s.lon,
  }));

  // Center on user location when GPS becomes available
  useEffect(() => {
    if (mapRef.current && userLat && userLon) {
      mapRef.current.animateToRegion(
        {
          latitude: userLat,
          longitude: userLon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        800
      );
    }
  }, [userLat, userLon]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        userInterfaceStyle="light"
        initialRegion={{
          latitude: initLat,
          longitude: initLon,
          latitudeDelta,
          longitudeDelta,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        {/* Gold glow polyline — matches web CartoDB style */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="rgba(247,165,1,0.35)"
            strokeWidth={10}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Blue core route polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#0284c7"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Stop Markers — numbered circles */}
        {stops.map((stop, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === stops.length - 1;

          return (
            <Marker
              key={stop.id || `${stop.lat}-${stop.lon}-${idx}`}
              coordinate={{ latitude: stop.lat, longitude: stop.lon }}
              title={stop.name}
              onPress={() => onSelectStop?.(stop)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.stopDot,
                  isStart && styles.startStopDot,
                  isEnd && styles.endStopDot,
                ]}
              >
                <Text
                  style={[
                    styles.stopNumber,
                    (isStart || isEnd) && styles.terminalStopNumber,
                  ]}
                >
                  {idx + 1}
                </Text>
              </View>
            </Marker>
          );
        })}

        {/* Live Bus Marker */}
        {vehicleLat !== 0 && vehicleLon !== 0 && (
          <Marker
            coordinate={{ latitude: vehicleLat, longitude: vehicleLon }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={100}
          >
            <BusMarker leg={vehicleLeg} routeCode={routeCode} />
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  stopDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 3px rgba(0,0,0,0.15)',
    elevation: 2,
  },
  startStopDot: {
    backgroundColor: '#16A34A',
    borderColor: '#FFFFFF',
  },
  endStopDot: {
    backgroundColor: '#DC2626',
    borderColor: '#FFFFFF',
  },
  stopNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
  },
  terminalStopNumber: {
    color: '#FFFFFF',
  },
});
