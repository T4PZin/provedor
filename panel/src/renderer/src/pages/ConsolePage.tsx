import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'

export default function ConsolePage() {
  const { t } = useI18n()
  const [lines, setLines] = useState<string[]>([])
  const [cmd, setCmd] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const off = api.onServerLog((line) => {
      setLines((prev) => [...prev.slice(-499), line])
    })
    return off
  }, [])

  useEffect(() => {
    boxRef.current?.scrollTo(0, boxRef.current.scrollHeight)
  }, [lines])

  function send() {
    const c = cmd.trim()
    if (!c) return
    api.sendCommand(c)
    setCmd('')
  }

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{t('console.title')}</h3>
      <div className="console" ref={boxRef}>
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          className="input"
          style={{ marginTop: 0 }}
          placeholder={t('console.placeholder')}
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn" onClick={send}>
          {t('console.send')}
        </button>
      </div>
    </>
  )
}
