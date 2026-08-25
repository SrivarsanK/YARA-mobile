// packages/shared/lib/agencies.ts - Port from web dashboard

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

export interface AgencyPreset {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  accentColor: string;
  providerType: string;
  dataStatus: string;
  routes: string[];
}

export interface StopCoordinate {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const AGENCY_PRESETS: AgencyPreset[] = [
  {
    id: 'chennai',
    name: 'Metropolitan Transport Corp Chennai',
    shortName: 'MTC Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    accentColor: '#2563EB',
    providerType: 'CUMTA Chennai One',
    dataStatus: 'GTFS Static + Kalman',
    routes: ['S26', '21G', '26G R', 'S86', '70CCT R'],
  },
  {
    id: 'bmtc',
    name: 'Bengaluru Metropolitan Transport Corp',
    shortName: 'BMTC',
    city: 'Bengaluru',
    state: 'Karnataka',
    accentColor: '#0284C7',
    providerType: 'Namma BMTC',
    dataStatus: 'GTFS Static + Kalman',
    routes: ['101', '500D'],
  },
  {
    id: 'best-mumbai',
    name: 'BEST Undertaking Mumbai',
    shortName: 'BEST Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    accentColor: '#DC2626',
    providerType: 'Chalo Network',
    dataStatus: 'Chalo Chained Feed',
    routes: ['A-115', '332'],
  },
  {
    id: 'dtc-delhi',
    name: 'Delhi Transport Corp (DTC)',
    shortName: 'DTC Delhi',
    city: 'New Delhi',
    state: 'Delhi NCR',
    accentColor: '#16A34A',
    providerType: 'Delhi Open Transit Data',
    dataStatus: 'Open Real-time Feed',
    routes: ['534'],
  },
];

// Chennai S26 corridor stops (Ashok Pillar to Valasaravakkam)
export const S26_CORRIDOR_STOPS: StopCoordinate[] = [
  { id: 'S1', name: 'Ashok Pillar', lat: 13.03514, lon: 80.21089 },
  { id: 'S2', name: 'Ashok Pillar (Jaffarkhanpet)', lat: 13.03354, lon: 80.21209 },
  { id: 'S3', name: 'KK Nagar Telephone Exchange', lat: 13.03165, lon: 80.20930 },
  { id: 'S4', name: 'Bharathidasan Colony', lat: 13.03267, lon: 80.20532 },
  { id: 'S5', name: 'Kailankadai', lat: 13.03294, lon: 80.20302 },
  { id: 'S6', name: 'Indra Colony', lat: 13.03142, lon: 80.20248 },
  { id: 'S7', name: 'Saravana Electrical', lat: 13.03157, lon: 80.19923 },
  { id: 'S8', name: 'Anjali Mahal', lat: 13.03100, lon: 80.19660 },
  { id: 'S9', name: 'Anbu Wine Shop', lat: 13.03110, lon: 80.19499 },
  { id: 'S10', name: 'Sullaipallam', lat: 13.03135, lon: 80.19170 },
  { id: 'S11', name: 'Nesapakkam MGR Statue', lat: 13.03152, lon: 80.19123 },
  { id: 'S12', name: 'Nellai Stores', lat: 13.03163, lon: 80.18755 },
  { id: 'S13', name: 'Balaji Hospital', lat: 13.03167, lon: 80.18675 },
  { id: 'S14', name: 'Ramapuram Ashram', lat: 13.03175, lon: 80.18395 },
  { id: 'S15', name: 'SRM University / Ramapuram', lat: 13.03172, lon: 80.17865 },
  { id: 'S16', name: 'Ramapuram Main Road', lat: 13.03294, lon: 80.17584 },
  { id: 'S17', name: 'Ambedkar Salai - Ramapuram', lat: 13.03611, lon: 80.17505 },
  { id: 'S18', name: 'Venkatesawar Nagar', lat: 13.03982, lon: 80.17445 },
  { id: 'S19', name: 'Valasaravakkam', lat: 13.04104, lon: 80.17370 },
];
