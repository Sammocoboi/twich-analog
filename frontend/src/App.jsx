import { useState } from 'react'
import VideoPlayer from './components/VideoPlayer'
import { useStreams } from './hooks/useStreams'
import {
  API_PORT,
  DEFAULT_PATH,
  MEDIAMTX_HOST,
  RTMP_PORT,
  formatBytes,
  formatUptime,
  hlsUrl,
  obsSettings,
  plural,
  publishUrl,
  whepUrl,
} from './lib/mediamtx'
import './App.css'

const PROTOCOLS = [
  { id: 'webrtc', label: 'WebRTC', hint: 'минимум задержки' },
  { id: 'hls', label: 'HLS', hint: 'максимум совместимости' },
]

const PLAYER_STATUS_LABEL = {
  connecting: 'подключение',
  buffering: 'буфер',
  playing: 'играет',
  offline: 'офлайн',
  error: 'ошибка',
  unsupported: 'не поддерживается',
}

function normalizePath(value) {
  return value.trim().replace(/^\/+|\/+$/g, '') || DEFAULT_PATH
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="copy-field">
      <span className="copy-field__label">{label}</span>
      <code className="copy-field__value">{value}</code>
      <button type="button" className="button button--ghost" onClick={copy}>
        {copied ? '✓ Скопировано' : 'Копировать'}
      </button>
    </div>
  )
}

export default function App() {
  const [path, setPath] = useState(DEFAULT_PATH)
  const [draftPath, setDraftPath] = useState(DEFAULT_PATH)
  const [protocol, setProtocol] = useState('webrtc')
  const [playerStatus, setPlayerStatus] = useState('connecting')

  const { streams, error: apiError } = useStreams()
  const liveStreams = streams.filter((stream) => stream.ready)
  const current = streams.find((stream) => stream.name === path)
  const online = Boolean(current?.ready)
  const obs = obsSettings(path)

  const openChannel = (event) => {
    event.preventDefault()
    const next = normalizePath(draftPath)
    setPath(next)
    setDraftPath(next)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__dot" />
          <span>
            twich<span className="brand__accent">analog</span>
          </span>
        </div>

        <div className="topbar__right">
          <span className={`pill ${apiError ? 'pill--bad' : 'pill--ok'}`}>
            MediaMTX {apiError ? 'не запущен' : 'онлайн'}
          </span>
          <span className="pill pill--muted">
            {MEDIAMTX_HOST} · RTMP {RTMP_PORT}
          </span>
        </div>
      </header>

      <main className="layout">
        <section className="stage">
          <div className="stage__head">
            <div>
              <h1 className="channel">{path}</h1>
              <p className="channel__sub">
                <span className={`dot ${online ? 'dot--live' : ''}`} />
                {online ? 'в эфире' : 'не в эфире'}
                {current && online && ` · ${current.readers?.length ?? 0} зр.`}
              </p>
            </div>

            <div className="switch" role="group" aria-label="Протокол просмотра">
              {PROTOCOLS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`switch__item ${protocol === item.id ? 'switch__item--active' : ''}`}
                  onClick={() => setProtocol(item.id)}
                  title={item.hint}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <VideoPlayer
            path={path}
            protocol={protocol}
            streamOnline={online}
            onStatusChange={setPlayerStatus}
          />

          <div className="meta-grid">
            <div className="meta">
              <span className="meta__label">Плеер</span>
              <span className="meta__value">{PLAYER_STATUS_LABEL[playerStatus] ?? playerStatus}</span>
            </div>
            <div className="meta">
              <span className="meta__label">Зрители</span>
              <span className="meta__value">{current?.readers?.length ?? 0}</span>
            </div>
            <div className="meta">
              <span className="meta__label">В эфире</span>
              <span className="meta__value">{online ? formatUptime(current.readyTime) : '—'}</span>
            </div>
            <div className="meta">
              <span className="meta__label">Кодеки</span>
              <span className="meta__value meta__value--small">
                {current?.tracks?.length ? current.tracks.join(' + ') : '—'}
              </span>
            </div>
            <div className="meta">
              <span className="meta__label">Принято</span>
              <span className="meta__value meta__value--small">
                {online ? formatBytes(current.bytesReceived) : '—'}
              </span>
            </div>
          </div>

          <section className="panel">
            <h2 className="panel__title">Выйти в эфир</h2>

            <div className="publish-option">
              <h3 className="publish-option__title">
                1. Из браузера — ничего устанавливать не нужно
              </h3>
              <p className="panel__text">
                MediaMTX сам отдаёт страницу публикации. Откройте её, разрешите камеру и микрофон,
                выберите видео-кодек <strong>H264</strong> (тогда будет работать и HLS) и нажмите{' '}
                <strong>Publish</strong>.
              </p>
              <a
                className="button"
                href={publishUrl(path)}
                target="_blank"
                rel="noreferrer"
              >
                Открыть страницу публикации ↗
              </a>
              <p className="publish-option__hint">
                Работает только на этом компьютере через <code>localhost</code>: браузер разрешает
                камеру лишь на «безопасных» адресах. Для экрана (не камеры) нужен OBS portable или
                ffmpeg.
              </p>
            </div>

            <div className="publish-option">
              <h3 className="publish-option__title">2. Из OBS (если получится поставить)</h3>
              <p className="panel__text">
                OBS → <strong>Настройки → Вещание → Сервис: Настраиваемый</strong>. Вставьте сервер
                и ключ — MediaMTX создаст путь <code>{path}</code> сам, как только пойдёт первый кадр.
              </p>

              <div className="copy-list">
                <CopyField label="Сервер" value={obs.server} />
                <CopyField label="Ключ потока" value={obs.key} />
              </div>
            </div>

            <div className="links">
              <span className="links__item">
                <span className="links__label">HLS</span>
                <code>{hlsUrl(path)}</code>
              </span>
              <span className="links__item">
                <span className="links__label">WebRTC</span>
                <code>{whepUrl(path)}</code>
              </span>
            </div>
          </section>
        </section>

        <aside className="sidebar">
          <h2 className="panel__title">Сейчас в эфире</h2>

          {liveStreams.length === 0 ? (
            <p className="sidebar__empty">
              Никто не стримит. Запустите трансляцию — из браузера или OBS — канал появится здесь
              автоматически.
            </p>
          ) : (
            <ul className="streams">
              {liveStreams.map((stream) => (
                <li key={stream.name}>
                  <button
                    type="button"
                    className={`stream ${stream.name === path ? 'stream--active' : ''}`}
                    onClick={() => {
                      setPath(stream.name)
                      setDraftPath(stream.name)
                    }}
                  >
                    <span className="stream__thumb">LIVE</span>
                    <span className="stream__body">
                      <span className="stream__name">{stream.name}</span>
                      <span className="stream__meta">
                        {stream.readers?.length ?? 0}{' '}
                        {plural(stream.readers?.length ?? 0, ['зритель', 'зрителя', 'зрителей'])} ·{' '}
                        {formatUptime(stream.readyTime)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="path-form" onSubmit={openChannel}>
            <label className="path-form__label" htmlFor="path">
              Открыть другой канал
            </label>
            <div className="path-form__row">
              <input
                id="path"
                className="input"
                value={draftPath}
                onChange={(event) => setDraftPath(event.target.value)}
                placeholder="live/stream"
                autoComplete="off"
              />
              <button type="submit" className="button">
                Открыть
              </button>
            </div>
            <p className="path-form__hint">
              Имя канала — это путь в MediaMTX. Плеер читает его напрямую, без базы данных.
            </p>
          </form>

          <div className="sidebar__api">
            <span className="meta__label">API</span>
            <code>
              http://{MEDIAMTX_HOST}:{API_PORT}/v3/paths/list
            </code>
            {apiError && <p className="sidebar__error">{apiError.message}</p>}
          </div>
        </aside>
      </main>
    </div>
  )
}
