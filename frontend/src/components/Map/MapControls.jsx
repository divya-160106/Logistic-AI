import React from 'react'
import { Plus, Layers, LocateFixed } from 'lucide-react'
import './MapView.css'

export default function MapControls({ addMode, onToggleAddMode }) {
  return (
    <div className="map-controls">
      <button
        className={`map-ctrl-btn ${addMode ? 'active' : ''}`}
        onClick={onToggleAddMode}
        title="Add waypoint (click map)"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
