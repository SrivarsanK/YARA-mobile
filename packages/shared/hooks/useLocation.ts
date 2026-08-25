// packages/shared/hooks/useLocation.ts
import { useState, useEffect } from 'react';

export interface UseLocationReturn {
  lat: number;
  lon: number;
  error: string | null;
  loading: boolean;
}

export function useLocation(): UseLocationReturn {
  const [lat, setLat] = useState<number>(13.0302);
  const [lon, setLon] = useState<number>(80.1806);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Default Chennai coordinates
    setLat(13.0302);
    setLon(80.1806);
  }, []);

  return { lat, lon, error, loading };
}
