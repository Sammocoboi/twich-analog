import { useEffect, useRef, useState } from 'react'
import { hlsUrl, whepUrl } from '../lib/mediamtx'

const RETRY_DELAY = 3000

const STATUS_TEXT = {
  connecting: 'Подключаемся к потоку…',
  buffering: 'Буферизация…',
  offline: 'Поток офлайн',
  error: 'Ошибка воспроизведения',
  unsupported: 'Браузер не поддерживает это видео',
}

/**
 * Плеер одного канала.
 *
 * protocol = 'webrtc'  → WHEP, задержка ~0.3–1 c
 * protocol = 'hls'     → hls.js (или нативный HLS в Safari), задержка 4–10 c
 *
 * Компонент сам переподключается каждые 3 секунды, если поток
 * ещё не запущен или оборвался.
 */
export default function VideoPlayer({ path, protocol, streamOnline, onStatusChange }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [muted, setMuted] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !path) return

    let disposed = false
    let retryTimer = null
    let connectTimer = null
    let hls = null
    let pc = null
    let whepSession = null

    setStatus('connecting')
    video.srcObject = null
    video.removeAttribute('src')

    const retryLater = () => {
      if (disposed || retryTimer) return
      retryTimer = setTimeout(() => {
        if (!disposed) setAttempt((value) => value + 1)
      }, RETRY_DELAY)
    }

    const play = () => {
      // Браузер может запретить автоплей со звуком — это нормально,
      // пользователь нажмёт ▶ в нативных контролах.
      video.play().catch(() => {})
    }

    // ── HLS ────────────────────────────────────────────────
    const startHls = async () => {
      // hls.js грузим только когда он реально понадобился:
      // WebRTC-плеер не тащит 500 КБ библиотеки.
      const { default: Hls } = await import('hls.js')
      if (disposed) return

      // Порядок важен: hls.js умеет low-latency HLS, а нативный
      // HLS в Chrome/Electron часто не понимает LL-HLS-плейлисты.
      if (Hls.isSupported()) {
        hls = new Hls({
          lowLatencyMode: true,
          backBufferLength: 30,
        })
        hls.loadSource(hlsUrl(path))
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, play)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || disposed || !hls) return

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
            return
          }

          setStatus(data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'offline' : 'error')
          hls.destroy()
          hls = null
          retryLater()
        })
        return
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari/iOS умеют HLS нативно (MSE там нет).
        video.src = hlsUrl(path)
        play()
        return
      }

      setStatus('unsupported')
    }

    // ── WebRTC (WHEP) ──────────────────────────────────────
    const startWhep = async () => {
      pc = new RTCPeerConnection({ iceServers: [] })

      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })
      pc.ontrack = (event) => {
        if (event.streams[0]) {
          video.srcObject = event.streams[0]
          play()
        }
      }
      pc.onconnectionstatechange = () => {
        if (disposed) return
        if (pc.connectionState === 'connected') {
          if (connectTimer) {
            clearTimeout(connectTimer)
            connectTimer = null
          }
          return
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('offline')
          retryLater()
        }
      }

      // 1. Формируем SDP-offer: «хочу получать видео и звук».
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 2. Отправляем его MediaMTX по HTTP POST (это и есть WHEP).
      const response = await fetch(whepUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      })
      if (!response.ok) throw new Error(`WHEP ответил ${response.status}`)

      // 3. Получаем SDP-answer и URL сессии (её надо удалить при выходе).
      const answer = await response.text()
      whepSession = response.headers.get('Location')

      if (disposed) {
        if (whepSession) fetch(whepSession, { method: 'DELETE' }).catch(() => {})
        return
      }

      await pc.setRemoteDescription({ type: 'answer', sdp: answer })
      play()

      // Если ICE «завис» (например, UDP закрыт), не висим в
      // «Подключаемся…» вечно — через 8 секунд пробуем заново.
      connectTimer = setTimeout(() => {
        connectTimer = null
        if (!disposed && pc.connectionState !== 'connected') {
          setStatus('offline')
          retryLater()
        }
      }, 8000)
    }

    const start = async () => {
      try {
        if (protocol === 'webrtc') {
          await startWhep()
        } else {
          await startHls()
        }
      } catch (error) {
        if (disposed) return
        console.warn('Не удалось подключиться к потоку:', error)
        setStatus('offline')
        retryLater()
      }
    }

    start()

    return () => {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      if (connectTimer) clearTimeout(connectTimer)
      if (hls) hls.destroy()
      if (whepSession) fetch(whepSession, { method: 'DELETE' }).catch(() => {})
      if (pc) {
        pc.ontrack = null
        pc.onconnectionstatechange = null
        pc.close()
      }
      video.srcObject = null
      video.removeAttribute('src')
      video.load()
    }
  }, [path, protocol, attempt])

  const overlayVisible = status !== 'playing' && status !== 'buffering'

  return (
    <div className="player">
      <video
        ref={videoRef}
        className="player__video"
        autoPlay
        playsInline
        muted={muted}
        controls
        onPlaying={() => setStatus('playing')}
        onWaiting={() => setStatus((current) => (current === 'playing' ? 'buffering' : current))}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      />

      <div className="player__badges">
        <span className="badge badge--live">LIVE</span>
        <span className="badge">{protocol === 'webrtc' ? 'WebRTC ≈1 c' : 'HLS ≈4–8 c'}</span>
      </div>

      {overlayVisible && (
        <div className="player__overlay">
          {status === 'offline' || status === 'error' ? (
            <>
              <p className="player__overlay-title">
                {streamOnline ? 'Не удалось подключиться' : STATUS_TEXT[status]}
              </p>
              <p className="player__overlay-hint">
                {streamOnline ? (
                  protocol === 'webrtc' ? (
                    <>
                      Поток идёт, но WebRTC-соединение не установилось. Переключитесь на <strong>HLS</strong>{' '}
                      или проверьте UDP-порт 8189.
                    </>
                  ) : (
                    <>
                      Поток идёт, но HLS не загрузился. Проверьте порт 8888 и ошибки в консоли браузера.
                    </>
                  )
                ) : (
                  <>
                    Запустите трансляцию в OBS на путь <code>{path}</code> — плеер подключится сам.
                  </>
                )}
              </p>
              <button type="button" className="button" onClick={() => setAttempt((value) => value + 1)}>
                Повторить сейчас
              </button>
            </>
          ) : (
            <>
              <span className="spinner" aria-hidden="true" />
              <p className="player__overlay-title">{STATUS_TEXT[status]}</p>
            </>
          )}
        </div>
      )}

      {muted && status === 'playing' && (
        <button type="button" className="player__unmute" onClick={() => setMuted(false)}>
          🔊 Включить звук
        </button>
      )}
    </div>
  )
}
