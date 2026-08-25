// packages/user-app/src/components/Map/types.ts
import type { BusLeg } from '@yara/shared';
import type { StopCoordinate } from '../../constants/agencies';

export interface MapViewProps {
  vehicleLat: number;
  vehicleLon: number;
  vehicleLeg: BusLeg;
  routeCode?: string;
  stops?: StopCoordinate[];
  centerLat?: number;
  centerLon?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  onSelectStop?: (stop: StopCoordinate) => void;
}
