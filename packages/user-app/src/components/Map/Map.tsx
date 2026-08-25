// packages/user-app/src/components/Map/Map.tsx
import React from 'react';
import { Platform } from 'react-native';
import type { MapViewProps } from './types';

export const Map: React.FC<MapViewProps> = (props) => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Map: WebMap } = require('./Map.web');
    return <WebMap {...props} />;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Map: NativeMap } = require('./Map.native');
  return <NativeMap {...props} />;
};
