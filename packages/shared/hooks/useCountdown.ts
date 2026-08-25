// packages/shared/hooks/useCountdown.ts
import { useState, useEffect } from 'react';

export function useCountdown(initialSeconds: number): number {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  return seconds;
}
