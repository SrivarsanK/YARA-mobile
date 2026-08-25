// packages/user-app/src/components/Map/Map.web.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Circle,
  Polyline,
  G,
  Text as SvgText,
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { MapViewProps } from './types';
import { S26_CORRIDOR_STOPS } from '@yara/shared/lib/agencies';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const Map: React.FC<MapViewProps> = ({
  vehicleLat,
  vehicleLon,
  vehicleLeg,
  routeCode = 'S26',
  stops = S26_CORRIDOR_STOPS,
  onSelectStop,
}) => {
  // SVG Canvas dimensions
  const svgWidth = 400;
  const svgHeight = 400;
  const padding = 45;

  // Bounding box calculation for coordinate transformation
  const allLats = stops.map((s) => s.lat);
  const allLons = stops.map((s) => s.lon);
  if (vehicleLat) allLats.push(vehicleLat);
  if (vehicleLon) allLons.push(vehicleLon);

  const minLat = Math.min(...allLats) - 0.003;
  const maxLat = Math.max(...allLats) + 0.003;
  const minLon = Math.min(...allLons) - 0.003;
  const maxLon = Math.max(...allLons) + 0.003;

  const toX = (lon: number) => {
    const range = maxLon - minLon || 0.01;
    return padding + ((lon - minLon) / range) * (svgWidth - 2 * padding);
  };

  const toY = (lat: number) => {
    const range = maxLat - minLat || 0.01;
    // Invert Y coordinate so North is up
    return svgHeight - padding - ((lat - minLat) / range) * (svgHeight - 2 * padding);
  };

  const polylinePoints = stops.map((s) => `${toX(s.lon).toFixed(1)},${toY(s.lat).toFixed(1)}`).join(' ');

  const busX = toX(vehicleLon || stops[0]?.lon || 80.1806);
  const busY = toY(vehicleLat || stops[0]?.lat || 13.0302);

  // Pulsing animations
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const dwellOpacity = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(2.2, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (vehicleLeg === 'dwell') {
      dwellOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      dwellOpacity.value = 1;
    }
  }, [vehicleLeg]);

  const haloProps = useAnimatedProps(() => ({
    r: 12 * pulseScale.value,
    opacity: pulseOpacity.value,
  }));

  const busColor =
    vehicleLeg === 'outbound'
      ? '#64748B' // desaturated slate
      : vehicleLeg === 'dwell'
      ? '#F59E0B' // amber
      : '#2563EB'; // solid blue

  const busOpacity = vehicleLeg === 'outbound' ? 0.6 : 1;

  return (
    <View style={styles.container}>
      {/* City & Route Watermark */}
      <View style={styles.watermarkContainer}>
        <Text style={styles.watermarkCity}>CHENNAI MTC CORRIDOR</Text>
        <Text style={styles.watermarkRoute}>Route {routeCode} | Live Simulation</Text>
      </View>

      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={styles.svg}
      >
        <Defs>
          <LinearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0B1120" />
            <Stop offset="100%" stopColor="#0F172A" />
          </LinearGradient>
        </Defs>

        {/* Map Background */}
        <Rect width={svgWidth} height={svgHeight} fill="url(#bgGradient)" />

        {/* Subtle Grid Lines */}
        {[80, 160, 240, 320].map((pos) => (
          <G key={`grid-${pos}`} opacity={0.15}>
            <Path d={`M ${pos} 0 L ${pos} ${svgHeight}`} stroke="#38BDF8" strokeWidth={0.5} strokeDasharray="3,3" />
            <Path d={`M 0 ${pos} L ${svgWidth} ${pos}`} stroke="#38BDF8" strokeWidth={0.5} strokeDasharray="3,3" />
          </G>
        ))}

        {/* Outer Glow Line */}
        {stops.length > 1 && (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#routeGlow)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Core Route Line */}
        {stops.length > 1 && (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Stops Circles & Labels */}
        {stops.map((stop, idx) => {
          const sx = toX(stop.lon);
          const sy = toY(stop.lat);
          const isStart = idx === 0;
          const isEnd = idx === stops.length - 1;

          return (
            <G key={stop.id || `stop-${idx}`} onPress={() => onSelectStop?.(stop)}>
              <Circle
                cx={sx}
                cy={sy}
                r={isStart || isEnd ? 7 : 4}
                fill={isStart ? '#16A34A' : isEnd ? '#DC2626' : '#FFFFFF'}
                stroke={isStart || isEnd ? '#FFFFFF' : '#2563EB'}
                strokeWidth={2}
              />
              {(isStart || isEnd || idx % 4 === 0) && (
                <SvgText
                  x={sx}
                  y={sy - 10}
                  fill="#94A3B8"
                  fontSize={8}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {stop.name.length > 14 ? stop.name.substring(0, 12) + '...' : stop.name}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Live Bus Marker */}
        <G transform={`translate(${busX}, ${busY})`}>
          {/* Animated Halo */}
          <AnimatedCircle
            cx={0}
            cy={0}
            animatedProps={haloProps}
            fill={busColor}
          />

          {/* Outer Ring */}
          <Circle
            cx={0}
            cy={0}
            r={14}
            fill={busColor}
            opacity={busOpacity}
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />

          {/* Bus Glyph Shape inside */}
          <G transform="translate(-6, -6) scale(0.6)" opacity={busOpacity}>
            <Path
              d="M 4 2 L 16 2 C 18 2 19 3 19 5 L 19 16 C 19 18 18 19 16 19 L 4 19 C 2 19 1 18 1 16 L 1 5 C 1 3 2 2 4 2 Z M 3 7 L 17 7 M 3 13 L 17 13 M 5 16 A 1.5 1.5 0 1 0 5 13 A 1.5 1.5 0 1 0 5 16 Z M 15 16 A 1.5 1.5 0 1 0 15 13 A 1.5 1.5 0 1 0 15 16 Z"
              fill="#FFFFFF"
            />
          </G>

          {/* Floating Route Pill */}
          <G transform="translate(0, -22)">
            <Rect
              x={-18}
              y={-8}
              width={36}
              height={14}
              rx={4}
              fill="#FFFFFF"
              stroke={busColor}
              strokeWidth={1}
            />
            <SvgText
              x={0}
              y={2}
              fill={busColor}
              fontSize={8}
              fontWeight="900"
              textAnchor="middle"
            >
              {routeCode}
            </SvgText>
          </G>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  watermarkCity: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  watermarkRoute: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
});
