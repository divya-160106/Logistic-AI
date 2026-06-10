import { create } from 'zustand'
import api from '../utils/api'

const SESSION_ID = 'session_' + Math.random().toString(36).slice(2, 8)

export const useStore = create((set, get) => ({
  sessionId: SESSION_ID,
  locations: [],
  selectedLocationId: null,
  route: null,
  isOptimizing: false,
  userAvailability: {
    windows: [{ start: '08:00', end: '18:00', label: 'Work Day' }],
    start_location: null,
    max_travel_time_minutes: 480,
  },
  externalFactors: {
    rain: 0,
    snow: 0,
    traffic: 0,
    construction: 0,
    fog: 0,
    wind: 0,
    road_closure: 0,
  },
  activePanel: 'locations', // 'locations' | 'availability' | 'factors' | 'route'
  wsConnected: false,
  notifications: [],
  mapCenter: [40.7128, -74.006],
  mapZoom: 6,

  setActivePanel: (panel) => set({ activePanel: panel }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setWsConnected: (v) => set({ wsConnected: v }),

  addNotification: (msg, type = 'info') => {
    const id = Date.now()
    set((s) => ({ notifications: [...s.notifications, { id, msg, type }] }))
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
    }, 4000)
  },

  // Locations
  addLocation: (loc) => {
    const newLoc = {
      id: 'loc_' + Date.now(),
      session_id: get().sessionId,
      name: loc.name || `Location ${get().locations.length + 1}`,
      lat: loc.lat,
      lng: loc.lng,
      criticality: loc.criticality || 'medium',
      availability_windows: loc.availability_windows || [],
      is_available: true,
      address: loc.address || '',
      notes: '',
    }
    set((s) => ({ locations: [...s.locations, newLoc] }))
    api.post('/locations', newLoc).catch(() => {})
    get().addNotification(`Added: ${newLoc.name}`, 'success')
    return newLoc
  },

  updateLocation: (id, updates) => {
    set((s) => ({
      locations: s.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))
    const loc = get().locations.find((l) => l.id === id)
    if (loc) api.put(`/locations/${id}`, { ...loc, ...updates }).catch(() => {})
  },

  removeLocation: (id) => {
    set((s) => ({
      locations: s.locations.filter((l) => l.id !== id),
      selectedLocationId: s.selectedLocationId === id ? null : s.selectedLocationId,
      route: null,
    }))
    api.delete(`/locations/${id}`).catch(() => {})
    get().addNotification('Location removed', 'warning')
  },

  selectLocation: (id) => set({ selectedLocationId: id }),

  // User availability
  setUserAvailability: (data) => {
    set({ userAvailability: data })
    api.put(`/user/${get().sessionId}`, data).catch(() => {})
  },

  // External factors
  setExternalFactors: (data) => {
    set({ externalFactors: data })
    api.put(`/factors/${get().sessionId}`, data).catch(() => {})
  },

  // Route optimization
  optimizeRoute: async () => {
    const { locations, userAvailability, externalFactors, sessionId } = get()
    if (locations.length < 2) {
      get().addNotification('Add at least 2 locations to optimize', 'warning')
      return
    }
    set({ isOptimizing: true, route: null })
    try {
      const res = await api.post('/routes/optimize', {
        session_id: sessionId,
        locations,
        user_availability: userAvailability,
        external_factors: externalFactors,
        start_location: userAvailability.start_location,
      })
      set({ route: res.data, activePanel: 'route' })
      get().addNotification(
        `Route optimized — ${res.data.ordered_locations.length} stops, ${res.data.total_distance_km}km`,
        'success'
      )
    } catch (e) {
      get().addNotification('Optimization failed: ' + (e.message || 'unknown error'), 'error')
    } finally {
      set({ isOptimizing: false })
    }
  },

  clearRoute: () => set({ route: null }),
}))
