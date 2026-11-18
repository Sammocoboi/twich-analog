// Все адреса MediaMTX в одном месте.
// Меняются через frontend/.env (см. .env.example).

const env = import.meta.env

export const MEDIAMTX_HOST = env.VITE_MEDIAMTX_HOST || '127.0.0.1'
export const RTMP_PORT = env.VITE_MEDIAMTX_RTMP_PORT || '1935'
export const HLS_PORT = env.VITE_MEDIAMTX_HLS_PORT || '8888'
export const WEBRTC_PORT = env.VITE_MEDIAMTX_WEBRTC_PORT || '8889'
export const API_PORT = env.VITE_MEDIAMTX_API_PORT || '9997'
export const DEFAULT_PATH = env.VITE_STREAM_PATH || 'live/stream'

const origin = (port) => `http://${MEDIAMTX_HOST}:${port}`

/** HLS-плейлист потока: обычный HTTP, задержка 4–10 c. */
export const hlsUrl = (path) => `${origin(HLS_PORT)}/${path}/index.m3u8`

/** WHEP-эндпоинт WebRTC: задержка меньше секунды. */
export const whepUrl = (path) => `${origin(WEBRTC_PORT)}/${path}/whep`

/** Страница публикации из браузера, которую отдаёт сам MediaMTX. */
export const publishUrl = (path) => `${origin(WEBRTC_PORT)}/${path}/publish`

/** REST API MediaMTX. */
export const apiUrl = (endpoint) => `${origin(API_PORT)}${endpoint}`

/** Список всех путей (потоков), которые сейчас знает MediaMTX. */
export async function fetchPaths(signal) {
  const response = await fetch(apiUrl('/v3/paths/list?itemsPerPage=100'), { signal })
  if (!response.ok) {
    throw new Error(`MediaMTX API ответил ${response.status}`)
  }
  const data = await response.json()
  return data.items ?? []
}

/**
 * Как настроить OBS, чтобы попасть в поток path.
 * MediaMTX берёт имя пути из URL публикации: сервер + ключ.
 *   live/stream  ->  server: rtmp://host:1935/live, key: stream
 */
export function obsSettings(path) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 1) {
    return { server: `rtmp://${MEDIAMTX_HOST}:${RTMP_PORT}`, key: parts[0] ?? '' }
  }
  const key = parts.at(-1)
  return {
    server: `rtmp://${MEDIAMTX_HOST}:${RTMP_PORT}/${parts.slice(0, -1).join('/')}`,
    key,
  }
}

/** Секунды -> "1 ч 05 мин" / "12 мин 03 с". */
export function formatUptime(startedAt) {
  if (!startedAt) return '—'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h} ч ${String(m).padStart(2, '0')} мин`
  if (m > 0) return `${m} мин ${String(s).padStart(2, '0')} с`
  return `${s} с`
}

/** Склонение: plural(1, ['зритель', 'зрителя', 'зрителей']). */
export function plural(count, forms) {
  const n = Math.abs(count) % 100
  const last = n % 10
  if (n > 10 && n < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

/** Байты в человекочитаемый вид. */
export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} Б`
  const units = ['КБ', 'МБ', 'ГБ', 'ТБ']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${units[unit]}`
}
