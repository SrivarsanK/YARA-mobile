// packages/user-app/src/components/Map/Map.web.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { MapViewProps } from './types';
import { S26_CORRIDOR_STOPS } from '@yara/shared/lib/agencies';

const loadLeafletFromCDN = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve(null);
    if ((window as any).L) return resolve((window as any).L);

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (existingScript) {
      if ((window as any).L) return resolve((window as any).L);
      existingScript.addEventListener('load', () => resolve((window as any).L));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve((window as any).L);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

export const Map: React.FC<MapViewProps> = ({
  vehicleLat,
  vehicleLon,
  vehicleLeg,
  routeCode = 'S26',
  stops = S26_CORRIDOR_STOPS,
  userLat,
  userLon,
  onSelectStop,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const polylineGlowRef = useRef<any>(null);
  const polylineMainRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initLeaflet = async () => {
      try {
        const L = await loadLeafletFromCDN();

        if (!isMounted || !mapContainerRef.current || !L) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const centerLat = userLat ?? vehicleLat ?? stops[0]?.lat ?? 13.0302;
        const centerLon = userLon ?? vehicleLon ?? stops[0]?.lon ?? 80.1806;

        // Initialize Leaflet Map
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLon],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        // CartoDB Voyager Light Tiles (Authentic Web Dashboard Aesthetic)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Route Polylines
        const latLons = stops.map((s) => [s.lat, s.lon]);

        if (latLons.length > 1) {
          polylineGlowRef.current = L.polyline(latLons, {
            color: '#f7a501',
            weight: 10,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);

          polylineMainRef.current = L.polyline(latLons, {
            color: '#0284c7',
            weight: 5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
        }

        // Stop Markers (Numbered 1..N)
        stopMarkersRef.current = stops.map((s, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === stops.length - 1;
          const bgColor = isStart ? '#16a34a' : isEnd ? '#dc2626' : '#ffffff';
          const textColor = isStart || isEnd ? '#ffffff' : '#0284c7';

          const stopIcon = L.divIcon({
            className: '',
            html: `
              <div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${bgColor};
                border: 2px solid ${isStart || isEnd ? '#ffffff' : '#0284c7'};
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 10px;
                color: ${textColor};
                cursor: pointer;
                user-select: none;
              ">
                ${idx + 1}
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([s.lat, s.lon], { icon: stopIcon }).addTo(map);
          marker.bindTooltip(s.name, { direction: 'top', offset: [0, -12] });
          marker.on('click', () => onSelectStop?.(s));
          return marker;
        });

        // User GPS Beacon
        if (userLat && userLon) {
          const userIcon = L.divIcon({
            className: '',
            html: `
              <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(16,185,129,0.25);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#10b981;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(16,185,129,0.4);"></div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          userMarkerRef.current = L.marker([userLat, userLon], { icon: userIcon, zIndexOffset: 800 }).addTo(map);
        }

        // Live Bus Marker with Pulsing Halo
        const vLat = vehicleLat || stops[0]?.lat || 13.0302;
        const vLon = vehicleLon || stops[0]?.lon || 80.1806;

        const busIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(247,165,1,0.35);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg, #f7a501, #ea580c);border:3px solid #ffffff;box-shadow:0 4px 12px rgba(247,165,1,0.4);display:flex;align-items:center;justify-content:center;">
                <span style="color:#ffffff;font-size:16px;">🚌</span>
              </div>
              <div style="position:absolute;top:-18px;background:#0f172a;border:1px solid #f7a501;color:#ffffff;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:900;letter-spacing:0.4px;white-space:nowrap;">
                ${routeCode}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        busMarkerRef.current = L.marker([vLat, vLon], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);

        // Fit bounds to show route
        if (latLons.length > 0) {
          map.fitBounds(L.latLngBounds(latLons), { padding: [40, 40] });
        }

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Leaflet map initialization error:', err);
      }
    };

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stops, routeCode, userLat, userLon]);

  // Update live vehicle marker position
  useEffect(() => {
    if (busMarkerRef.current && vehicleLat && vehicleLon) {
      busMarkerRef.current.setLatLng([vehicleLat, vehicleLon]);
    }
  }, [vehicleLat, vehicleLon]);

  // Update user GPS location
  useEffect(() => {
    if (userMarkerRef.current && userLat && userLon) {
      userMarkerRef.current.setLatLng([userLat, userLon]);
    }
  }, [userLat, userLon]);

  return (
    <View style={styles.container}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '260px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#f6f4eb',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 260,
    backgroundColor: '#F6F4EB',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
