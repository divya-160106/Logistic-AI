import React from 'react'
import { Cloud, Snowflake, Car, Hammer, Eye, Wind, AlertOctagon, Save } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './Panel.css'

const FACTORS = [
  { key: 'rain', label: 'Rain', icon: Cloud, color: '#3b82f6', desc: 'Reduces speed, increases hazard' },
  { key: 'snow', label: 'Snow / Ice', icon: Snowflake, color: '#93c5fd', desc: 'Major mobility impact' },
  { key: 'traffic', label: 'Traffic', icon: Car, color: '#f59e0b', desc: 'Congestion on primary routes' },
  { key: 'construction', label: 'Construction', icon: Hammer, color: '#f97316', desc: 'Lane closures, detours' },
  { key: 'fog', label: 'Fog / Visibility', icon: Eye, color: '#94a3b8', desc: 'Reduces safe speed' },
  { key: 'wind', label: 'High Winds', icon: Wind, color: '#a78bfa', desc: 'Affects larger vehicles' },
  { key: 'road_closure', label: 'Road Closures', icon: AlertOctagon, color: '#ef4444', desc: 'Forces rerouting' },
]

function severityLabel(v) {
  if (v === 0) return 'None'
  if (v < 0.3) return 'Low'
  if (v < 0.6) return 'Moderate'
  if (v < 0.85) return 'High'
  return 'Severe'
}

function severityColor(v) {
  if (v === 0) return 'var(--text-muted)'
  if (v < 0.3) return '#10b981'
  if (v < 0.6) return '#f59e0b'
  if (v < 0.85) return '#f97316'
  return '#ef4444'
}

export default function FactorsPanel() {
  const externalFactors = useStore((s) => s.externalFactors)
  const setExternalFactors = useStore((s) => s.setExternalFactors)
  const addNotification = useStore((s) => s.addNotification)

  const update = (key, value) => {
    setExternalFactors({ ...externalFactors, [key]: value })
  }

  const clearAll = () => {
    const cleared = Object.fromEntries(FACTORS.map((f) => [f.key, 0]))
    setExternalFactors(cleared)
    addNotification('All conditions cleared', 'info')
  }

  const activeCount = FACTORS.filter((f) => externalFactors[f.key] > 0).length
  const totalImpact = FACTORS.reduce((acc, f) => acc + (externalFactors[f.key] || 0), 0)

  return (
    <div className="panel">
      <div className="panel-header">
        <Cloud size={15} color="#00d4ff" />
        <span className="panel-title">Environmental Conditions</span>
        {activeCount > 0 && <span className="panel-badge warn">{activeCount} active</span>}
      </div>

      <div className="editor-body">
        {activeCount > 0 && (
          <div className="impact-card">
            <div className="impact-label">ROUTING IMPACT</div>
            <div className="impact-bar-wrap">
              <div
                className="impact-bar"
                style={{ width: `${Math.min(100, totalImpact * 60)}%`, background: severityColor(totalImpact / FACTORS.length) }}
              />
            </div>
            <div className="impact-pct" style={{ color: severityColor(totalImpact / FACTORS.length) }}>
              +{Math.round(totalImpact * 25)}% slower
            </div>
          </div>
        )}

        <div className="factors-list">
          {FACTORS.map(({ key, label, icon: Icon, color, desc }) => {
            const val = externalFactors[key] || 0
            return (
              <div key={key} className={`factor-row ${val > 0 ? 'active' : ''}`}>
                <div className="factor-header">
                  <div className="factor-icon-wrap" style={{ background: `${color}18`, borderColor: `${color}30` }}>
                    <Icon size={14} color={val > 0 ? color : 'var(--text-muted)'} />
                  </div>
                  <div className="factor-info">
                    <span className="factor-label">{label}</span>
                    <span className="factor-desc">{desc}</span>
                  </div>
                  <span className="factor-severity" style={{ color: severityColor(val) }}>
                    {severityLabel(val)}
                  </span>
                </div>
                <div className="factor-slider-row">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={val}
                    onChange={(e) => update(key, parseFloat(e.target.value))}
                    className="slider factor-slider"
                    style={{ '--track-color': val > 0 ? color : 'var(--bg-elevated)' }}
                  />
                  <span className="factor-pct">{Math.round(val * 100)}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {activeCount > 0 && (
          <button className="clear-btn" onClick={clearAll}>
            Clear All Conditions
          </button>
        )}
      </div>
    </div>
  )
}
