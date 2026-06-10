import React from 'react'
import { useStore } from '../../store/useStore.js'
import './StatsBar.css'

export default function StatsBar() {
  const locations = useStore((s) => s.locations)
  const route = useStore((s) => s.route)
  const externalFactors = useStore((s) => s.externalFactors)

  const highCount = locations.filter((l) => l.criticality === 'high').length
  const medCount = locations.filter((l) => l.criticality === 'medium').length
  const lowCount = locations.filter((l) => l.criticality === 'low').length
  const unavailCount = locations.filter((l) => !l.is_available).length

  const activeConditions = Object.entries(externalFactors)
    .filter(([k, v]) => k !== 'session_id' && Number(v) > 0).length

  return (
    <div className="stats-bar">
      <div className="stats-row">
        <div className="stat-cell">
          <span className="sc-val">{locations.length}</span>
          <span className="sc-label">Nodes</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-cell">
          <span className="sc-val" style={{ color: '#ef4444' }}>{highCount}</span>
          <span className="sc-label">High</span>
        </div>
        <div className="stat-cell">
          <span className="sc-val" style={{ color: '#f59e0b' }}>{medCount}</span>
          <span className="sc-label">Med</span>
        </div>
        <div className="stat-cell">
          <span className="sc-val" style={{ color: '#10b981' }}>{lowCount}</span>
          <span className="sc-label">Low</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-cell">
          <span className="sc-val" style={{ color: activeConditions > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
            {activeConditions}
          </span>
          <span className="sc-label">Conds</span>
        </div>
        {route && (
          <>
            <div className="stat-divider" />
            <div className="stat-cell">
              <span className="sc-val" style={{ color: '#00d4ff' }}>{route.feasibility_score}%</span>
              <span className="sc-label">Score</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
