import React, { useState } from 'react'
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './Panel.css'

const CRIT_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981', desc: 'Best effort' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', desc: 'Standard priority' },
  { value: 'high', label: 'High', color: '#ef4444', desc: 'Must complete' },
]

export default function LocationEditor({ location, onClose }) {
  const updateLocation = useStore((s) => s.updateLocation)
  const addNotification = useStore((s) => s.addNotification)

  const [form, setForm] = useState({
    name: location.name || '',
    criticality: location.criticality || 'medium',
    notes: location.notes || '',
    availability_windows: location.availability_windows || [],
  })

  const addWindow = () => {
    setForm((f) => ({
      ...f,
      availability_windows: [...f.availability_windows, { start: '09:00', end: '17:00' }],
    }))
  }

  const removeWindow = (idx) => {
    setForm((f) => ({
      ...f,
      availability_windows: f.availability_windows.filter((_, i) => i !== idx),
    }))
  }

  const updateWindow = (idx, field, value) => {
    setForm((f) => {
      const windows = [...f.availability_windows]
      windows[idx] = { ...windows[idx], [field]: value }
      return { ...f, availability_windows: windows }
    })
  }

  const handleSave = () => {
    updateLocation(location.id, form)
    addNotification(`Saved: ${form.name}`, 'success')
    onClose()
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <button className="back-btn" onClick={onClose}>
          <ChevronLeft size={15} />
        </button>
        <span className="panel-title">Edit Waypoint</span>
      </div>

      <div className="editor-body">
        <div className="field-group">
          <label className="field-label">NAME</label>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Location name"
          />
        </div>

        <div className="field-group">
          <label className="field-label">COORDINATES</label>
          <div className="coord-display">
            <span className="coord-val">{location.lat.toFixed(6)}</span>
            <span className="coord-sep">,</span>
            <span className="coord-val">{location.lng.toFixed(6)}</span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">CRITICALITY LEVEL</label>
          <div className="crit-selector">
            {CRIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`crit-option ${form.criticality === opt.value ? 'active' : ''}`}
                style={{ '--crit-color': opt.color }}
                onClick={() => setForm((f) => ({ ...f, criticality: opt.value }))}
              >
                <span className="crit-dot" style={{ background: opt.color }} />
                <div>
                  <div className="crit-opt-label">{opt.label}</div>
                  <div className="crit-opt-desc">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label">AVAILABILITY WINDOWS</label>
            <button className="add-window-btn" onClick={addWindow}>
              <Plus size={11} /> Add
            </button>
          </div>
          {form.availability_windows.length === 0 ? (
            <p className="field-hint">No time constraints — available all day</p>
          ) : (
            <div className="windows-list">
              {form.availability_windows.map((w, i) => (
                <div key={i} className="window-row">
                  <input
                    type="time"
                    className="time-input"
                    value={w.start}
                    onChange={(e) => updateWindow(i, 'start', e.target.value)}
                  />
                  <span className="window-sep">→</span>
                  <input
                    type="time"
                    className="time-input"
                    value={w.end}
                    onChange={(e) => updateWindow(i, 'end', e.target.value)}
                  />
                  <button className="icon-btn danger" onClick={() => removeWindow(i)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field-group">
          <label className="field-label">NOTES</label>
          <textarea
            className="field-textarea"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..."
            rows={3}
          />
        </div>

        <button className="save-btn" onClick={handleSave}>
          <Save size={14} />
          Save Changes
        </button>
      </div>
    </div>
  )
}
