import { useEffect, useState } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { api } from './api'
import type { ServerStatus } from '../../types'
import Layout, { View } from './components/Layout'
import Dashboard from './pages/Dashboard'
import ConsolePage from './pages/ConsolePage'
import InventoryPage from './pages/InventoryPage'
import SettingsPage from './pages/SettingsPage'

function Shell() {
  const { t, lang, setLang } = useI18n()
  const [view, setView] = useState<View>('dashboard')
  const [status, setStatus] = useState<ServerStatus>({ running: false, players: 0, maxPlayers: 0 })

  useEffect(() => {
    const off = api.onServerStatus(setStatus)
    return off
  }, [])

  return (
    <Layout view={view} setView={setView} status={status}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{t('app.title')}</h2>
        <label style={{ color: 'var(--muted)', fontSize: 13 }}>
          {t('lang.label')}:{' '}
          <select value={lang} onChange={(e) => setLang(e.target.value as 'pt' | 'en')}>
            <option value="pt">PT</option>
            <option value="en">EN</option>
          </select>
        </label>
      </div>
      {view === 'dashboard' && <Dashboard />}
      {view === 'console' && <ConsolePage />}
      {view === 'inventory' && <InventoryPage />}
      {view === 'settings' && <SettingsPage />}
    </Layout>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}
