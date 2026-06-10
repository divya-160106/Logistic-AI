import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import './Notifications.css'

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#00d4ff',
}

export default function Notifications() {
  const notifications = useStore((s) => s.notifications)

  return (
    <div className="notifications-container">
      {notifications.map(({ id, msg, type }) => {
        const Icon = ICONS[type] || Info
        const color = COLORS[type] || '#00d4ff'
        return (
          <div key={id} className="notification" style={{ '--notif-color': color }}>
            <Icon size={14} color={color} />
            <span>{msg}</span>
          </div>
        )
      })}
    </div>
  )
}
