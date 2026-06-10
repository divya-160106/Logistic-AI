import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

export function useWebSocket() {
  const wsRef = useRef(null)
  const setWsConnected = useStore((s) => s.setWsConnected)
  const addNotification = useStore((s) => s.addNotification)
  const sessionId = useStore((s) => s.sessionId)

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        console.log('WS connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'route_update') {
            addNotification('Route updated by server', 'info')
          }
        } catch {}
      }

      ws.onclose = () => {
        setWsConnected(false)
        setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        setWsConnected(false)
        ws.close()
      }
    }

    connect()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [sessionId])

  return wsRef
}
