// packages/user-app/src/components/Map/Map.native.tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { BusMarker } from '../BusMarker';
import type { MapViewProps } from './types';
import { S26_CORRIDOR_STOPS } from '../../constants/agencies';

export const Map: React.FC<MapViewProps> = ({
  vehicleLat,
  vehicleLon,
  vehicleLeg,
  routeCode = 'S26',
  stops = S26_CORRIDOR_STOPS,
  centerLat = 13.0302,
  centerLon = 80.1806,
  latitudeDelta = 0.12,
  longitudeDelta = 0.12,
  onSelectStop,
}) => {
  const mapRef = useRef<MapView>(null);

  const polylineCoords = stops.map((s) => ({
    latitude: s.lat,
    longitude: s.lon,
  }));

  // Initial center and bounds
  useEffect(() => {
    if (mapRef.current && polylineCoords.length > 0) {
      mapRef.current.fitToCoordinates(polylineCoords, {
        edgePadding: { top: 60, right: 60, bottom: 120, left: 60 },
        animated: true,
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLon,
          latitudeDelta: latitudeDelta,
          longitudeDelta: longitudeDelta,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Glow Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="rgba(37, 99, 235, 0.3)"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Core Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#2563EB"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Stop Markers */}
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
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
    color: '#2563EB',
  },
  terminalStopNumber: {
    color: '#FFFFFF',
  },
});
