import React from 'react'
import { Activity, Wifi, WifiOff, Cpu, Zap, FlaskConical } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { DEMO_LOCATIONS, DEMO_FACTORS, DEMO_AVAILABILITY } from '../../utils/demoData.js'
import './TopBar.css'

export default function TopBar() {
  const wsConnected = useStore((s) => s.wsConnected)
  const locations = useStore((s) => s.locations)
  const route = useStore((s) => s.route)
  const isOptimizing = useStore((s) => s.isOptimizing)
  const optimizeRoute = useStore((s) => s.optimizeRoute)
  const addLocation = useStore((s) => s.addLocation)
  const setExternalFactors = useStore((s) => s.setExternalFactors)
  const setUserAvailability = useStore((s) => s.setUserAvailability)
  const addNotification = useStore((s) => s.addNotification)

  const loadDemo = () => {
    if (locations.length > 0) return
    DEMO_LOCATIONS.forEach((l) => addLocation(l))
    setExternalFactors(DEMO_FACTORS)
    setUserAvailability(DEMO_AVAILABILITY)
    addNotification('Demo scenario loaded — 8 NYC locations', 'success')
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-icon">
          <Cpu size={18} color="#00d4ff" />
        </div>
        <span className="brand-name">LogisticAI</span>
        <span className="brand-tag">CONTROL SYSTEM v1.0</span>
      </div>

      <div className="topbar-stats">
        <div className="stat-pill">
          <span className="stat-label">NODES</span>
          <span className="stat-value">{locations.length}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-label">ACTIVE</span>
          <span className="stat-value accent">{locations.filter(l => l.is_available).length}</span>
        </div>
        {route && (
          <>
            <div className="stat-pill">
              <span className="stat-label">DIST</span>
              <span className="stat-value">{route.total_distance_km}km</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">TIME</span>
              <span className="stat-value">{Math.floor(route.total_time_minutes / 60)}h{Math.round(route.total_time_minutes % 60)}m</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">SCORE</span>
              <span className="stat-value" style={{ color: route.feasibility_score > 70 ? '#10b981' : route.feasibility_score > 40 ? '#f59e0b' : '#ef4444' }}>
                {route.feasibility_score}%
              </span>
            </div>
          </>
        )}
      </div>

      <div className="topbar-actions">
        <div className={`ws-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {locations.length === 0 && (
          <button className="demo-btn" onClick={loadDemo}>
            <FlaskConical size={13} />
            LOAD DEMO
          </button>
        )}

        <button
          className={`optimize-btn ${isOptimizing ? 'loading' : ''}`}
          onClick={optimizeRoute}
          disabled={isOptimizing || locations.length < 2}
        >
          <Zap size={14} />
          {isOptimizing ? 'OPTIMIZING...' : 'OPTIMIZE ROUTE'}
        </button>
      </div>
    </header>
  )
}
