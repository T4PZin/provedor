import { useEffect, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import type { Settings } from '../../../types'

export default function SettingsPage() {
  const { t } = useI18n()
  const [form, setForm] = useState<Settings>({ serverPath: '', port: 27015, gslt: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.loadSettings().then(setForm)
  }, [])

  const portValid = Number.isInteger(form.port) && form.port >= 1 && form.port <= 65535
  const gsltValid = /^[a-zA-Z0-9]{8,}$/.test(form.gslt)
  const valid = portValid && gsltValid

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function save() {
    if (!valid) return
    await api.saveSettings(form)
    setSaved(true)
  }

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{t('settings.title')}</h3>

      <div className="card">
        <label className="label">{t('settings.serverPath')}</label>
        <input
          className="input"
          value={form.serverPath}
          onChange={(e) => update('serverPath', e.target.value)}
        />

        <label className="label">{t('settings.serverExe')}</label>
        <input
          className="input"
          value={form.serverExe ?? ''}
          placeholder="cs2.exe (auto)"
          onChange={(e) => update('serverExe', e.target.value)}
        />

        <label className="label">{t('settings.port')}</label>
        <input
          className="input"
          type="number"
          value={form.port}
          onChange={(e) => update('port', Number(e.target.value))}
        />
        {!portValid && <div className="error">{t('settings.invalidPort')}</div>}

        <label className="label">{t('settings.gslt')}</label>
        <input
          className="input"
          value={form.gslt}
          onChange={(e) => update('gslt', e.target.value)}
        />
        {!gsltValid && <div className="error">{t('settings.invalidGslt')}</div>}

        <div style={{ marginTop: 14 }}>
          <button className="btn" disabled={!valid} onClick={save}>
            {t('settings.save')}
          </button>
          {saved && <span style={{ color: 'var(--ok)', marginLeft: 10 }}>✓</span>}
        </div>
      </div>
    </>
  )
}
