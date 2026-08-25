// packages/shared/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value.
 * @param value The value to debounce
 * @param delayMs Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
