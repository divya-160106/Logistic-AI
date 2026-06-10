import React from 'react'
import MapView from './components/Map/MapView.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import TopBar from './components/Sidebar/TopBar.jsx'
import Notifications from './components/Dashboard/Notifications.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'
import { useSessionPersistence } from './hooks/useSessionPersistence.js'
import './App.css'

export default function App() {
  useWebSocket()
  useSessionPersistence()

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="map-area">
          <MapView />
        </main>
      </div>
      <Notifications />
    </div>
  )
}
