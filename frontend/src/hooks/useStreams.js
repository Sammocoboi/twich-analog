import { useEffect, useState } from 'react'
import { fetchPaths } from '../lib/mediamtx'

/**
 * Раз в intervalMs спрашивает у MediaMTX список путей.
 * Так интерфейс узнаёт, кто сейчас в эфире, сколько зрителей
 * и с какими кодеками идёт поток.
 */
export function useStreams(intervalMs = 3000) {
  const [streams, setStreams] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    let timer = null
    let disposed = false

    const tick = async () => {
      try {
        const items = await fetchPaths(controller.signal)
        if (!disposed) {
          setStreams(items)
          setError(null)
        }
      } catch (err) {
        if (!disposed && err.name !== 'AbortError') {
          setStreams([])
          setError(err)
        }
      } finally {
        if (!disposed) timer = setTimeout(tick, intervalMs)
      }
    }

    tick()

    return () => {
      disposed = true
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [intervalMs])

  return { streams, error }
}
