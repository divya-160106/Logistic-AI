import React, { useState } from 'react'
import { Clock, Plus, Trash2, Save, MapPin } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './Panel.css'

export default function AvailabilityPanel() {
  const userAvailability = useStore((s) => s.userAvailability)
  const setUserAvailability = useStore((s) => s.setUserAvailability)
  const addNotification = useStore((s) => s.addNotification)
  const [form, setForm] = useState(userAvailability)

  const addWindow = () => {
    setForm((f) => ({
      ...f,
      windows: [...f.windows, { start: '09:00', end: '17:00', label: `Window ${f.windows.length + 1}` }],
    }))
  }

  const removeWindow = (idx) => {
    setForm((f) => ({ ...f, windows: f.windows.filter((_, i) => i !== idx) }))
  }

  const updateWindow = (idx, field, value) => {
    setForm((f) => {
      const windows = [...f.windows]
      windows[idx] = { ...windows[idx], [field]: value }
      return { ...f, windows }
    })
  }

  const handleSave = () => {
    setUserAvailability(form)
    addNotification('Availability windows updated', 'success')
  }

  const totalMinutes = form.windows.reduce((acc, w) => {
    const [sh, sm] = w.start.split(':').map(Number)
    const [eh, em] = w.end.split(':').map(Number)
    return acc + Math.max(0, eh * 60 + em - sh * 60 - sm)
  }, 0)

  return (
    <div className="panel">
      <div className="panel-header">
        <Clock size={15} color="#00d4ff" />
        <span className="panel-title">User Availability</span>
      </div>

      <div className="editor-body">
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">TOTAL WINDOW</span>
            <span className="info-val">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
          </div>
          <div className="info-row">
            <span className="info-label">ACTIVE WINDOWS</span>
            <span className="info-val">{form.windows.length}</span>
          </div>
        </div>

        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label">TIME WINDOWS</label>
            <button className="add-window-btn" onClick={addWindow}>
              <Plus size={11} /> Add Window
            </button>
          </div>

          {form.windows.length === 0 ? (
            <p className="field-hint">No availability windows set</p>
          ) : (
            <div className="windows-list">
              {form.windows.map((w, i) => (
                <div key={i} className="window-block">
                  <div className="window-header-row">
                    <input
                      className="window-label-input"
                      value={w.label || ''}
                      onChange={(e) => updateWindow(i, 'label', e.target.value)}
                      placeholder={`Window ${i + 1}`}
                    />
                    <button className="icon-btn danger" onClick={() => removeWindow(i)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="window-row">
                    <span className="time-label">FROM</span>
                    <input type="time" className="time-input" value={w.start} onChange={(e) => updateWindow(i, 'start', e.target.value)} />
                    <span className="time-label">TO</span>
                    <input type="time" className="time-input" value={w.end} onChange={(e) => updateWindow(i, 'end', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field-group">
          <label className="field-label">MAX TRAVEL TIME</label>
          <div className="slider-row">
            <input
              type="range"
              min={60}
              max={720}
              step={30}
              value={form.max_travel_time_minutes}
              onChange={(e) => setForm((f) => ({ ...f, max_travel_time_minutes: Number(e.target.value) }))}
              className="slider"
            />
            <span className="slider-val">{Math.floor(form.max_travel_time_minutes / 60)}h {form.max_travel_time_minutes % 60}m</span>
          </div>
        </div>

        <button className="save-btn" onClick={handleSave}>
          <Save size={14} />
          Save Availability
        </button>
      </div>
    </div>
  )
}
