import React from 'react'
import { MapPin, Clock, Cloud, Navigation, BarChart3 } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import LocationsPanel from '../Panels/LocationsPanel.jsx'
import AvailabilityPanel from '../Panels/AvailabilityPanel.jsx'
import FactorsPanel from '../Panels/FactorsPanel.jsx'
import RoutePanel from '../Panels/RoutePanel.jsx'
import StatsBar from './StatsBar.jsx'
import './Sidebar.css'

const NAV_ITEMS = [
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'availability', label: 'Availability', icon: Clock },
  { key: 'factors', label: 'Conditions', icon: Cloud },
  { key: 'route', label: 'Route Plan', icon: Navigation },
]

export default function Sidebar() {
  const activePanel = useStore((s) => s.activePanel)
  const setActivePanel = useStore((s) => s.setActivePanel)
  const route = useStore((s) => s.route)

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${activePanel === key ? 'active' : ''}`}
            onClick={() => setActivePanel(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {key === 'route' && route && (
              <span className="nav-badge">{route.ordered_locations.length}</span>
            )}
          </button>
        ))}
      </nav>

      <StatsBar />

      <div className="sidebar-content">
        {activePanel === 'locations' && <LocationsPanel />}
        {activePanel === 'availability' && <AvailabilityPanel />}
        {activePanel === 'factors' && <FactorsPanel />}
        {activePanel === 'route' && <RoutePanel />}
      </div>
    </aside>
  )
}
