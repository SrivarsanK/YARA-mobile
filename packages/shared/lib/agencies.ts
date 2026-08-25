// packages/shared/lib/agencies.ts — Port from web dashboard

export interface Agency {
  id: string;
  name: string;
  city: string;
  bounds: { lat: number; lon: number; latDelta: number; lonDelta: number };
  routes: string[];
}

export const AGENCIES: Agency[] = [
  {
    id: 'chennai',
    name: 'Chennai MTC',
    city: 'Chennai',
    bounds: { lat: 13.0302, lon: 80.1806, latDelta: 0.3, lonDelta: 0.3 },
    routes: ['S26', 'S27', 'S28', 'S29'],
  },
];

export function getAgencyById(id: string): Agency | undefined {
  return AGENCIES.find(a => a.id === id);
}
