// packages/shared/hooks/useLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationResult {
  lat: number | null;
  lon: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(): LocationResult {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function requestAndFetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setError('Permission to access location was denied');
            setLoading(false);
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setLat(location.coords.latitude);
          setLon(location.coords.longitude);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to get location';
          setError(message);
          setLoading(false);
        }
      }
    }

    requestAndFetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { lat, lon, error, loading };
}
