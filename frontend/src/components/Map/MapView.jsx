import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '../../store/useStore.js'
import MapControls from './MapControls.jsx'
import MapLegend from './MapLegend.jsx'
import LiveFeed from '../Dashboard/LiveFeed.jsx'
import './MapView.css'

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CRIT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

function createLocationIcon(loc, index, isSelected) {
  const color = CRIT_COLORS[loc.criticality] || '#3b82f6'
  const size = isSelected ? 36 : 30
  const borderWidth = isSelected ? 3 : 2
  const glowColor = isSelected ? color : 'transparent'

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${color}22;
        border:${borderWidth}px solid ${color};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 ${isSelected ? 16 : 8}px ${color}66, inset 0 0 8px ${color}22;
        position:relative;
        transition:all 0.2s;
      ">
        <span style="color:${color};font-size:${isSelected ? 12 : 10}px;font-weight:800;font-family:'JetBrains Mono',monospace;">${index + 1}</span>
        ${!loc.is_available ? `<div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:14px;font-weight:900;">✕</span>
        </div>` : ''}
      </div>
    `,
  })
}

function createRouteStopIcon(loc, index) {
  const color = '#00d4ff'
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:#00d4ff18;border:2px solid #00d4ff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 10px #00d4ff44;
        animation: routePulse 2s ease-in-out infinite ${index * 0.15}s;
      ">
        <span style="color:#00d4ff;font-size:9px;font-weight:800;font-family:'JetBrains Mono',monospace;">${index + 1}</span>
      </div>
    `,
  })
}

export default function MapView() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const routeLayerRef = useRef(null)
  const routeMarkersRef = useRef([])

  const locations = useStore((s) => s.locations)
  const selectedLocationId = useStore((s) => s.selectedLocationId)
  const selectLocation = useStore((s) => s.selectLocation)
  const addLocation = useStore((s) => s.addLocation)
  const route = useStore((s) => s.route)
  const mapCenter = useStore((s) => s.mapCenter)
  const mapZoom = useStore((s) => s.mapZoom)

  const [addMode, setAddMode] = useState(false)
  const addModeRef = useRef(false)

  useEffect(() => {
    addModeRef.current = addMode
  }, [addMode])

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', (e) => {
      if (!addModeRef.current) return
      const { lat, lng } = e.latlng
      const name = `Waypoint ${Date.now().toString().slice(-4)}`
      addLocation({ lat, lng, name, criticality: 'medium' })
      setAddMode(false)
    })

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Sync location markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!locations.find((l) => l.id === id)) {
        map.removeLayer(markersRef.current[id])
        delete markersRef.current[id]
      }
    })

    // Add/update markers
    locations.forEach((loc, idx) => {
      const isSelected = loc.id === selectedLocationId
      const icon = createLocationIcon(loc, idx, isSelected)

      if (markersRef.current[loc.id]) {
        markersRef.current[loc.id].setIcon(icon)
        markersRef.current[loc.id].setLatLng([loc.lat, loc.lng])
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(buildPopupContent(loc), { maxWidth: 260 })

        marker.on('click', () => selectLocation(loc.id))
        markersRef.current[loc.id] = marker
      }
    })
  }, [locations, selectedLocationId])

  // Draw route
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear previous route
    if (routeLayerRef.current) {
      routeLayerRef.current.forEach((l) => map.removeLayer(l))
      routeLayerRef.current = null
    }
    routeMarkersRef.current.forEach((m) => map.removeLayer(m))
    routeMarkersRef.current = []

    if (!route || !route.ordered_locations.length) return

    const latlngs = route.ordered_locations.map((l) => [l.lat, l.lng])

    // Animated route line
    const layers = []

    // Background glow line
    const glowLine = L.polyline(latlngs, {
      color: '#00d4ff',
      weight: 8,
      opacity: 0.15,
      lineJoin: 'round',
    }).addTo(map)
    layers.push(glowLine)

    // Main route line
    const routeLine = L.polyline(latlngs, {
      color: '#00d4ff',
      weight: 2.5,
      opacity: 0.9,
      dashArray: '8 6',
      lineJoin: 'round',
    }).addTo(map)
    layers.push(routeLine)

    routeLayerRef.current = layers

    // Route stop markers
    route.ordered_locations.forEach((loc, i) => {
      const m = L.marker([loc.lat, loc.lng], { icon: createRouteStopIcon(loc, i) })
        .addTo(map)
        .bindPopup(buildRoutePopup(loc, i), { maxWidth: 220 })
      routeMarkersRef.current.push(m)
    })

    // Fit bounds
    const bounds = L.latLngBounds(latlngs)
    map.fitBounds(bounds, { padding: [60, 60] })
  }, [route])

  function buildPopupContent(loc) {
    const color = CRIT_COLORS[loc.criticality]
    return `
      <div style="font-family:'Inter',sans-serif;min-width:200px;">
        <div style="font-weight:700;font-size:14px;color:#e2e8f0;margin-bottom:8px;">${loc.name}</div>
        <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
          <span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;">${loc.criticality.toUpperCase()}</span>
          <span style="color:${loc.is_available ? '#10b981' : '#ef4444'};font-size:11px;">${loc.is_available ? '● Available' : '● Unavailable'}</span>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#475569;">${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</div>
        ${loc.availability_windows?.length ? `<div style="margin-top:6px;font-size:10px;color:#94a3b8;">Windows: ${loc.availability_windows.map(w => `${w.start}–${w.end}`).join(', ')}</div>` : ''}
      </div>
    `
  }

  function buildRoutePopup(loc, idx) {
    return `
      <div style="font-family:'Inter',sans-serif;min-width:180px;">
        <div style="color:#00d4ff;font-size:10px;font-family:'JetBrains Mono',monospace;margin-bottom:4px;">STOP ${idx + 1}</div>
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:6px;">${loc.name}</div>
        <div style="font-size:11px;color:#94a3b8;">Arrival: <span style="color:#00d4ff;font-family:'JetBrains Mono',monospace;">${loc.arrival_time || '–'}</span></div>
        ${loc.travel_from_prev_km ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">${loc.travel_from_prev_km}km · ${loc.travel_from_prev_min}min from prev</div>` : ''}
      </div>
    `
  }

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />
      <MapLegend />
      <MapControls addMode={addMode} onToggleAddMode={() => setAddMode((v) => !v)} />
      <LiveFeed />
      {addMode && (
        <div className="map-add-hint">
          <span>Click anywhere to place a waypoint</span>
          <button onClick={() => setAddMode(false)}>Cancel</button>
        </div>
      )}
      <style>{`
        @keyframes routePulse {
          0%, 100% { box-shadow: 0 0 10px #00d4ff44; }
          50% { box-shadow: 0 0 20px #00d4ff99; }
        }
      `}</style>
    </div>
  )
}
