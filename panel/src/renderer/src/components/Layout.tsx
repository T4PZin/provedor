import { ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { ServerStatus } from '../../../types'

export type View = 'dashboard' | 'console' | 'inventory' | 'settings'

interface Props {
  view: View
  setView: (v: View) => void
  status: ServerStatus
  children: ReactNode
}

export default function Layout({ view, setView, status, children }: Props) {
  const { t } = useI18n()

  const items: { id: View; label: string }[] = [
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'console', label: t('nav.console') },
    { id: 'inventory', label: t('nav.inventory') },
    { id: 'settings', label: t('nav.settings') }
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>{t('app.title')}</h1>
        {items.map((it) => (
          <button
            key={it.id}
            className={`nav-btn ${view === it.id ? 'active' : ''}`}
            onClick={() => setView(it.id)}
          >
            {it.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <span
            className="dot"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: status.running ? 'var(--ok)' : 'var(--danger)',
              marginRight: 6
            }}
          />
          <small style={{ color: 'var(--muted)' }}>
            {status.running ? t('dashboard.running') : t('dashboard.stopped')}
          </small>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
