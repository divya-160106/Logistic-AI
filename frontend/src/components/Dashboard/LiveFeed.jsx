import React, { useEffect, useRef, useState } from 'react'
import { Activity, Wifi, WifiOff, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './LiveFeed.css'

const EVENT_ICONS = {
  location_added: '📍',
  location_removed: '🗑',
  location_updated: '✏️',
  route_optimized: '🧭',
  factors_updated: '🌦',
  availability_updated: '🕐',
  ws_connected: '🟢',
  ws_disconnected: '🔴',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
}

function useActivityLog() {
  const [events, setEvents] = useState([
    {
      id: 1,
      type: 'info',
      message: 'LogisticAI Control System initialized',
      time: new Date().toLocaleTimeString(),
    },
  ])

  const addEvent = (type, message) => {
    setEvents((prev) => [
      { id: Date.now(), type, message, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49),
    ])
  }

  return { events, addEvent, clearEvents: () => setEvents([]) }
}

export default function LiveFeed() {
  const wsConnected = useStore((s) => s.wsConnected)
  const locations = useStore((s) => s.locations)
  const route = useStore((s) => s.route)
  const externalFactors = useStore((s) => s.externalFactors)
  const isOptimizing = useStore((s) => s.isOptimizing)

  const { events, addEvent, clearEvents } = useActivityLog()

  const prevLocCount = useRef(locations.length)
  const prevWs = useRef(wsConnected)
  const prevRoute = useRef(route)
  const prevOptimizing = useRef(isOptimizing)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (locations.length > prevLocCount.current) {
      addEvent('location_added', `Waypoint added: "${locations[locations.length - 1]?.name}"`)
    } else if (locations.length < prevLocCount.current) {
      addEvent('location_removed', `Waypoint removed (${locations.length} remaining)`)
    }
    prevLocCount.current = locations.length
  }, [locations.length])

  useEffect(() => {
    if (wsConnected !== prevWs.current) {
      addEvent(
        wsConnected ? 'ws_connected' : 'ws_disconnected',
        wsConnected ? 'WebSocket connected — live sync active' : 'WebSocket disconnected — retrying...'
      )
      prevWs.current = wsConnected
    }
  }, [wsConnected])

  useEffect(() => {
    if (route && route !== prevRoute.current) {
      addEvent(
        'route_optimized',
        `Route computed — ${route.ordered_locations.length} stops, ${route.total_distance_km}km, score ${route.feasibility_score}%`
      )
      if (route.warnings.length > 0) {
        route.warnings.slice(0, 3).forEach((w) => addEvent('warning', w))
      }
      prevRoute.current = route
    }
  }, [route])

  useEffect(() => {
    if (prevOptimizing.current === false && isOptimizing === true) {
      addEvent('info', 'Running RL route optimization...')
    }
    prevOptimizing.current = isOptimizing
  }, [isOptimizing])

  const activeFactors = Object.entries(externalFactors)
    .filter(([k, v]) => k !== 'session_id' && v > 0)
    .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`)

  return (
    <div className="livefeed-panel">
      <div className="livefeed-header">
        <Activity size={13} color="#00d4ff" />
        <span className="livefeed-title">ACTIVITY LOG</span>
        <div className={`ws-dot ${wsConnected ? 'on' : 'off'}`} title={wsConnected ? 'Live' : 'Offline'} />
        <button className="livefeed-clear" onClick={clearEvents} title="Clear log">
          <Trash2 size={11} />
        </button>
      </div>

      {activeFactors.length > 0 && (
        <div className="livefeed-factors">
          <span className="factors-label">ACTIVE CONDITIONS:</span>
          {activeFactors.map((f) => (
            <span key={f} className="factor-tag">{f}</span>
          ))}
        </div>
      )}

      <div className="livefeed-scroll" ref={scrollRef}>
        {events.map((ev) => (
          <div key={ev.id} className={`feed-event feed-event--${ev.type}`}>
            <span className="feed-icon">{EVENT_ICONS[ev.type] || 'ℹ️'}</span>
            <span className="feed-msg">{ev.message}</span>
            <span className="feed-time">{ev.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
