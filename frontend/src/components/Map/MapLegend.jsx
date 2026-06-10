import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './MapLegend.css'

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(false)
  const route = useStore((s) => s.route)
  const externalFactors = useStore((s) => s.externalFactors)
  const locations = useStore((s) => s.locations)

  const activeFactors = Object.entries(externalFactors)
    .filter(([k, v]) => k !== 'session_id' && Number(v) > 0)

  return (
    <div className={`map-legend ${collapsed ? 'collapsed' : ''}`}>
      <div className="legend-header" onClick={() => setCollapsed((v) => !v)}>
        <span className="legend-title">MAP LEGEND</span>
        {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>

      {!collapsed && (
        <div className="legend-body">
          <div className="legend-section">
            <div className="legend-section-label">CRITICALITY</div>
            <div className="legend-row"><span className="legend-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />High Priority</div>
            <div className="legend-row"><span className="legend-dot" style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />Medium Priority</div>
            <div className="legend-row"><span className="legend-dot" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }} />Low Priority</div>
          </div>

          <div className="legend-section">
            <div className="legend-section-label">ROUTE</div>
            <div className="legend-row">
              <span className="legend-line" style={{ borderColor: '#00d4ff' }} />
              Optimized path
            </div>
            {route && (
              <div className="legend-route-info">
                <span className="legend-badge">{route.ordered_locations.length} stops</span>
                <span className="legend-badge">{route.total_distance_km}km</span>
                <span className="legend-badge" style={{
                  color: route.feasibility_score > 70 ? '#10b981' : route.feasibility_score > 40 ? '#f59e0b' : '#ef4444'
                }}>
                  {route.feasibility_score}% score
                </span>
              </div>
            )}
          </div>

          {activeFactors.length > 0 && (
            <div className="legend-section">
              <div className="legend-section-label">CONDITIONS</div>
              {activeFactors.map(([key, val]) => (
                <div key={key} className="legend-row legend-factor">
                  <div className="legend-factor-bar-wrap">
                    <div
                      className="legend-factor-bar"
                      style={{ width: `${Math.round(Number(val) * 100)}%` }}
                    />
                  </div>
                  <span className="legend-factor-label">{key.replace('_', ' ')}</span>
                  <span className="legend-factor-val">{Math.round(Number(val) * 100)}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="legend-section">
            <div className="legend-section-label">NODES</div>
            <div className="legend-counts">
              <div className="legend-count-item">
                <span className="lc-val">{locations.length}</span>
                <span className="lc-label">Total</span>
              </div>
              <div className="legend-count-item">
                <span className="lc-val" style={{ color: '#10b981' }}>{locations.filter(l => l.is_available).length}</span>
                <span className="lc-label">Active</span>
              </div>
              <div className="legend-count-item">
                <span className="lc-val" style={{ color: '#ef4444' }}>{locations.filter(l => l.criticality === 'high').length}</span>
                <span className="lc-label">High</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
