import { useEffect } from 'react'
import { useStore } from '../store/useStore.js'

const STORAGE_KEY = 'logisticai_session'

export function useSessionPersistence() {
  const locations = useStore((s) => s.locations)
  const userAvailability = useStore((s) => s.userAvailability)
  const externalFactors = useStore((s) => s.externalFactors)

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ locations, userAvailability, externalFactors, savedAt: Date.now() })
      )
    } catch {}
  }, [locations, userAvailability, externalFactors])

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (!saved || !saved.locations) return

      // Only restore if session is < 8 hours old
      if (Date.now() - saved.savedAt > 8 * 60 * 60 * 1000) return

      const store = useStore.getState()
      if (saved.locations.length > 0 && store.locations.length === 0) {
        saved.locations.forEach((l) => {
          useStore.setState((s) => ({ locations: [...s.locations, l] }))
        })
      }
      if (saved.userAvailability) {
        useStore.setState({ userAvailability: saved.userAvailability })
      }
      if (saved.externalFactors) {
        useStore.setState({ externalFactors: saved.externalFactors })
      }
    } catch {}
  }, [])
}
