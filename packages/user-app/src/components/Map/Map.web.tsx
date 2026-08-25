// packages/user-app/src/components/Map/Map.web.tsx
import React, { useEffect, useState } from 'react';
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
import type { MapViewProps } from './types';
import { S26_CORRIDOR_STOPS } from '@yara/shared/lib/agencies';

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

  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(timer);
  }, []);

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
    return svgHeight - padding - ((lat - minLat) / range) * (svgHeight - 2 * padding);
  };

  const polylinePoints = stops.map((s) => `${toX(s.lon).toFixed(1)},${toY(s.lat).toFixed(1)}`).join(' ');

  const busX = toX(vehicleLon || stops[0]?.lon || 80.1806);
  const busY = toY(vehicleLat || stops[0]?.lat || 13.0302);

  const busColor =
    vehicleLeg === 'outbound'
      ? '#64748B' // desaturated slate
      : vehicleLeg === 'dwell'
      ? '#F59E0B' // amber
      : '#0284C7'; // solid sky blue

  const haloRadius = 14 + (pulse % 30) * 0.4;
  const haloOpacity = Math.max(0, 0.5 - (pulse % 30) * 0.015);

  return (
    <View style={styles.container}>
      {/* Top Map Label */}
      <View style={styles.watermarkContainer}>
        <Text style={styles.watermarkCity}>CHENNAI MTC CORRIDOR</Text>
        <Text style={styles.watermarkRoute}>Route {routeCode} | Live Telemetry</Text>
      </View>

      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={styles.svg}
      >
        <Defs>
          <LinearGradient id="webBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#F8FAFC" />
            <Stop offset="100%" stopColor="#F1F5F9" />
          </LinearGradient>
        </Defs>

        {/* Light Map Background */}
        <Rect width={svgWidth} height={svgHeight} fill="url(#webBgGrad)" rx={12} />

        {/* Road Grid Pattern */}
        {[80, 160, 240, 320].map((pos) => (
          <G key={`grid-${pos}`} opacity={0.35}>
            <Path d={`M ${pos} 0 L ${pos} ${svgHeight}`} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4,4" />
            <Path d={`M 0 ${pos} L ${svgWidth} ${pos}`} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4,4" />
          </G>
        ))}

        {/* Outer Gold Glow Line (matches web CartoDB Voyager glow) */}
        {stops.length > 1 && (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#F7A501"
            strokeWidth={10}
            strokeOpacity={0.35}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Core Blue Route Line */}
        {stops.length > 1 && (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#0284C7"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Stops Numbered Circles & Labels */}
        {stops.map((stop, idx) => {
          const sx = toX(stop.lon);
          const sy = toY(stop.lat);
          const isStart = idx === 0;
          const isEnd = idx === stops.length - 1;

          return (
            <G key={stop.id || `stop-${idx}`}>
              {/* Outer circle */}
              <Circle
                cx={sx}
                cy={sy}
                r={isStart || isEnd ? 9 : 7}
                fill={isStart ? '#16A34A' : isEnd ? '#DC2626' : '#FFFFFF'}
                stroke={isStart || isEnd ? '#FFFFFF' : '#0284C7'}
                strokeWidth={2}
              />
              {/* Number inside */}
              <SvgText
                x={sx}
                y={sy + 3}
                fill={isStart || isEnd ? '#FFFFFF' : '#0284C7'}
                fontSize={7}
                fontWeight="900"
                textAnchor="middle"
              >
                {idx + 1}
              </SvgText>

              {/* Stop Name text */}
              {(isStart || isEnd || idx % 4 === 0) && (
                <SvgText
                  x={sx}
                  y={sy - 12}
                  fill="#475569"
                  fontSize={8.5}
                  fontWeight="800"
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
          {/* Pulsing Halo */}
          <Circle
            cx={0}
            cy={0}
            r={haloRadius}
            fill="#F7A501"
            opacity={haloOpacity}
          />

          {/* Outer Ring */}
          <Circle
            cx={0}
            cy={0}
            r={15}
            fill={busColor}
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />

          {/* Bus Glyph Shape inside */}
          <G transform="translate(-7, -7) scale(0.7)">
            <Path
              d="M 4 2 L 16 2 C 18 2 19 3 19 5 L 19 16 C 19 18 18 19 16 19 L 4 19 C 2 19 1 18 1 16 L 1 5 C 1 3 2 2 4 2 Z M 3 7 L 17 7 M 3 13 L 17 13 M 5 16 A 1.5 1.5 0 1 0 5 13 A 1.5 1.5 0 1 0 5 16 Z M 15 16 A 1.5 1.5 0 1 0 15 13 A 1.5 1.5 0 1 0 15 16 Z"
              fill="#FFFFFF"
            />
          </G>

          {/* Floating Route Pill */}
          <G transform="translate(0, -24)">
            <Rect
              x={-20}
              y={-9}
              width={40}
              height={16}
              rx={6}
              fill="#0F172A"
              stroke="#F7A501"
              strokeWidth={1}
            />
            <SvgText
              x={0}
              y={3}
              fill="#FFFFFF"
              fontSize={8.5}
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  watermarkCity: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  watermarkRoute: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
