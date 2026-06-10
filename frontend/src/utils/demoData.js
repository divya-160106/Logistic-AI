// Pre-seeded demo locations across New York City area
export const DEMO_LOCATIONS = [
  {
    name: 'JFK Airport',
    lat: 40.6413,
    lng: -73.7781,
    criticality: 'high',
    availability_windows: [{ start: '06:00', end: '22:00' }],
    is_available: true,
    notes: 'Primary hub — must visit',
  },
  {
    name: 'Manhattan HQ',
    lat: 40.7549,
    lng: -73.984,
    criticality: 'high',
    availability_windows: [{ start: '09:00', end: '18:00' }],
    is_available: true,
    notes: 'Executive office',
  },
  {
    name: 'Brooklyn Depot',
    lat: 40.6782,
    lng: -73.9442,
    criticality: 'medium',
    availability_windows: [{ start: '07:00', end: '20:00' }],
    is_available: true,
    notes: 'Logistics depot',
  },
  {
    name: 'Queens Warehouse',
    lat: 40.7282,
    lng: -73.7949,
    criticality: 'medium',
    availability_windows: [],
    is_available: true,
    notes: 'Secondary storage',
  },
  {
    name: 'Newark Port',
    lat: 40.6892,
    lng: -74.1745,
    criticality: 'high',
    availability_windows: [{ start: '08:00', end: '17:00' }],
    is_available: true,
    notes: 'Port of Newark — time sensitive',
  },
  {
    name: 'Hoboken Station',
    lat: 40.7359,
    lng: -74.0323,
    criticality: 'low',
    availability_windows: [{ start: '06:00', end: '23:00' }],
    is_available: true,
    notes: 'Transit hub',
  },
  {
    name: 'Bronx Distribution',
    lat: 40.8448,
    lng: -73.8648,
    criticality: 'medium',
    availability_windows: [{ start: '09:00', end: '16:00' }],
    is_available: false,
    notes: 'Currently under maintenance',
  },
  {
    name: 'Staten Island Yard',
    lat: 40.5795,
    lng: -74.1502,
    criticality: 'low',
    availability_windows: [],
    is_available: true,
    notes: 'Remote yard',
  },
]

export const DEMO_FACTORS = {
  rain: 0.4,
  snow: 0.0,
  traffic: 0.6,
  construction: 0.3,
  fog: 0.0,
  wind: 0.1,
  road_closure: 0.0,
}

export const DEMO_AVAILABILITY = {
  windows: [
    { start: '08:00', end: '18:00', label: 'Business Hours' },
  ],
  max_travel_time_minutes: 480,
}
