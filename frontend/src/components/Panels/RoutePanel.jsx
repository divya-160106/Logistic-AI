import React from 'react'
import { Navigation, AlertTriangle, CheckCircle, Clock, Ruler, Zap, RotateCcw, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './Panel.css'

const CRIT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

function ScoreGauge({ score }) {
  const color = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="score-gauge">
      <svg viewBox="0 0 100 60" width="120" height="72">
        <path d="M10 55 A45 45 0 0 1 90 55" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M10 55 A45 45 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 141} 141`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="50" y="52" textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          {score}
        </text>
      </svg>
      <div className="score-label">FEASIBILITY</div>
    </div>
  )
}

export default function RoutePanel() {
  const route = useStore((s) => s.route)
  const clearRoute = useStore((s) => s.clearRoute)
  const optimizeRoute = useStore((s) => s.optimizeRoute)
  const isOptimizing = useStore((s) => s.isOptimizing)
  const setActivePanel = useStore((s) => s.setActivePanel)

  if (!route) {
    return (
      <div className="panel">
        <div className="panel-header">
          <Navigation size={15} color="#00d4ff" />
          <span className="panel-title">Route Plan</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">
            <Navigation size={28} color="var(--text-muted)" />
          </div>
          <p className="empty-title">No route computed</p>
          <p className="empty-sub">Add locations and hit "Optimize Route" in the top bar</p>
          <button className="save-btn" style={{ marginTop: '16px' }} onClick={() => setActivePanel('locations')}>
            Add Locations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <Navigation size={15} color="#00d4ff" />
        <span className="panel-title">Route Plan</span>
        <button className="icon-btn" onClick={clearRoute} title="Clear route">
          <RotateCcw size={13} color="var(--text-muted)" />
        </button>
      </div>

      <div className="editor-body">
        {/* Summary */}
        <div className="route-summary">
          <ScoreGauge score={route.feasibility_score} />
          <div className="route-stats-grid">
            <div className="route-stat">
              <Ruler size={13} color="#00d4ff" />
              <div>
                <div className="route-stat-val">{route.total_distance_km} km</div>
                <div className="route-stat-label">Total Distance</div>
              </div>
            </div>
            <div className="route-stat">
              <Clock size={13} color="#00d4ff" />
              <div>
                <div className="route-stat-val">{Math.floor(route.total_time_minutes / 60)}h {Math.round(route.total_time_minutes % 60)}m</div>
                <div className="route-stat-label">Est. Duration</div>
              </div>
            </div>
            <div className="route-stat">
              <Navigation size={13} color="#00d4ff" />
              <div>
                <div className="route-stat-val">{route.ordered_locations.length}</div>
                <div className="route-stat-label">Stops</div>
              </div>
            </div>
            <div className="route-stat">
              <Zap size={13} color="#f59e0b" />
              <div>
                <div className="route-stat-val">×{route.factor_multiplier}</div>
                <div className="route-stat-label">Delay Factor</div>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {route.warnings.length > 0 && (
          <div className="warnings-block">
            <div className="warnings-title">
              <AlertTriangle size={13} color="#f59e0b" />
              WARNINGS ({route.warnings.length})
            </div>
            {route.warnings.map((w, i) => (
              <div key={i} className="warning-item">{w}</div>
            ))}
          </div>
        )}

        {/* Stop sequence */}
        <div className="field-group">
          <label className="field-label">STOP SEQUENCE</label>
          <div className="stop-list">
            {route.ordered_locations.map((loc, i) => (
              <div key={i} className={`stop-item ${loc._tw_violated ? 'violated' : ''}`}>
                <div className="stop-num">{i + 1}</div>
                <div className="stop-body">
                  <div className="stop-name">{loc.name}</div>
                  <div className="stop-meta">
                    <span className="stop-arrival">
                      <Clock size={10} /> {loc.arrival_time}
                    </span>
                    {loc.travel_from_prev_km > 0 && (
                      <span className="stop-dist">{loc.travel_from_prev_km}km · {loc.travel_from_prev_min}min</span>
                    )}
                  </div>
                </div>
                <div className="stop-crit" style={{ background: CRIT_COLORS[loc.criticality] + '22', color: CRIT_COLORS[loc.criticality] }}>
                  {loc.criticality.toUpperCase()[0]}
                </div>
                {loc._tw_violated && (
                  <AlertTriangle size={12} color="#f59e0b" title="Time window violation" />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          className="save-btn"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          onClick={optimizeRoute}
          disabled={isOptimizing}
        >
          <Zap size={13} />
          {isOptimizing ? 'Optimizing...' : 'Re-optimize'}
        </button>
      </div>
    </div>
  )
}
