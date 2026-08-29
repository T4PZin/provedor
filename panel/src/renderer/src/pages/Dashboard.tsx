import { useEffect, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import type { Player } from '../../../types'

export default function Dashboard() {
  const { t } = useI18n()
  const [running, setRunning] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const offStatus = api.onServerStatus((s) => setRunning(s.running))
    const off = api.onServerStatus(() => {})
    return () => {
      offStatus()
      off()
    }
  }, [])

  async function refresh() {
    setPlayers(await api.getPlayers())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function start() {
    setBusy(true)
    await api.startServer()
    await refresh()
    setBusy(false)
  }

  async function stop() {
    setBusy(true)
    await api.stopServer()
    setPlayers([])
    setBusy(false)
  }

  return (
    <>
      <div className="card">
        <strong>{t('dashboard.status')}:</strong>{' '}
        <span style={{ color: running ? 'var(--ok)' : 'var(--danger)' }}>
          {running ? t('dashboard.running') : t('dashboard.stopped')}
        </span>
        <div className="label">{t('dashboard.players')}: {players.length}</div>
        <div style={{ marginTop: 12 }}>
          {running ? (
            <button className="btn danger" disabled={busy} onClick={stop}>
              {t('dashboard.stop')}
            </button>
          ) : (
            <button className="btn" disabled={busy} onClick={start}>
              {t('dashboard.start')}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <strong>{t('dashboard.players')}</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {players.length === 0 && <li style={{ color: 'var(--muted)' }}>—</li>}
          {players.map((p) => (
            <li key={p.steamId}>
              {p.name} <small style={{ color: 'var(--muted)' }}>({p.steamId})</small>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
