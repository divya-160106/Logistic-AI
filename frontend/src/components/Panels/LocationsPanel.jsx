import React, { useState } from 'react'
import { MapPin, Plus, Trash2, Edit3, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import LocationEditor from './LocationEditor.jsx'
import './Panel.css'

const CRIT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
const CRIT_LABELS = { high: 'HIGH', medium: 'MED', low: 'LOW' }

export default function LocationsPanel() {
  const locations = useStore((s) => s.locations)
  const selectedLocationId = useStore((s) => s.selectedLocationId)
  const selectLocation = useStore((s) => s.selectLocation)
  const removeLocation = useStore((s) => s.removeLocation)
  const updateLocation = useStore((s) => s.updateLocation)
  const addNotification = useStore((s) => s.addNotification)

  const [editingId, setEditingId] = useState(null)
  const [showHint, setShowHint] = useState(locations.length === 0)

  const handleToggleAvailability = (loc) => {
    updateLocation(loc.id, { is_available: !loc.is_available })
    addNotification(`${loc.name}: ${loc.is_available ? 'disabled' : 'enabled'}`, 'info')
  }

  if (editingId) {
    const loc = locations.find((l) => l.id === editingId)
    return <LocationEditor location={loc} onClose={() => setEditingId(null)} />
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <MapPin size={15} color="#00d4ff" />
        <span className="panel-title">Route Nodes</span>
        <span className="panel-count">{locations.length}</span>
      </div>

      {locations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <MapPin size={28} color="var(--text-muted)" />
          </div>
          <p className="empty-title">No locations added</p>
          <p className="empty-sub">Click anywhere on the map to drop a waypoint</p>
        </div>
      ) : (
        <div className="location-list">
          {locations.map((loc, idx) => (
            <div
              key={loc.id}
              className={`location-card ${selectedLocationId === loc.id ? 'selected' : ''} ${!loc.is_available ? 'unavailable' : ''}`}
              onClick={() => selectLocation(loc.id)}
            >
              <div className="loc-index">{idx + 1}</div>
              <div className="loc-body">
                <div className="loc-name">{loc.name}</div>
                <div className="loc-meta">
                  <span className="loc-coords">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                  {loc.availability_windows.length > 0 && (
                    <span className="loc-windows">
                      {loc.availability_windows.map((w, i) => (
                        <span key={i} className="window-chip">{w.start}–{w.end}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="loc-actions">
                <span
                  className="crit-badge"
                  style={{ color: CRIT_COLORS[loc.criticality], borderColor: CRIT_COLORS[loc.criticality] + '44' }}
                >
                  {CRIT_LABELS[loc.criticality]}
                </span>
                <button
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); handleToggleAvailability(loc) }}
                  title={loc.is_available ? 'Disable location' : 'Enable location'}
                >
                  {loc.is_available ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                </button>
                <button
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); setEditingId(loc.id) }}
                  title="Edit location"
                >
                  <Edit3 size={13} color="var(--text-secondary)" />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={(e) => { e.stopPropagation(); removeLocation(loc.id) }}
                  title="Remove location"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel-footer">
        <div className="hint-text">
          <MapPin size={11} />
          <span>Click map to add waypoints</span>
        </div>
        {locations.length > 0 && (
          <div className="crit-legend">
            <span style={{ color: '#ef4444' }}>● HIGH</span>
            <span style={{ color: '#f59e0b' }}>● MED</span>
            <span style={{ color: '#10b981' }}>● LOW</span>
          </div>
        )}
      </div>
    </div>
  )
}
