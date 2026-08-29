import { useEffect, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import type { KnownPlayer, PaintEntry } from '../../../types'

function PaintPreview({ paint }: { paint: PaintEntry }) {
  return (
    <div className="paint">
      {paint.image ? (
        <img src={paint.image} alt={paint.name} loading="lazy" />
      ) : (
        <div
          style={{
            height: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0c10',
            borderRadius: 8,
            color: 'var(--muted)',
            fontSize: 11
          }}
        >
          {paint.category}
        </div>
      )}
      <div className="name">{paint.name}</div>
      <div className="rarity">{paint.rarity}</div>
    </div>
  )
}

export default function InventoryPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<PaintEntry[]>([])
  const [known, setKnown] = useState<KnownPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.loadCatalog(), api.getKnownPlayers()])
      .then(([catalog, players]) => {
        setItems(catalog)
        setKnown(players)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{t('inventory.title')}</h3>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <strong>{t('dashboard.error')}:</strong> {error}
        </div>
      )}

      <div className="card">
        <strong>{t('inventory.known')}</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {known.length === 0 && <li style={{ color: 'var(--muted)' }}>—</li>}
          {known.map((p) => (
            <li key={p.steamId}>
              {p.name} <small style={{ color: 'var(--muted)' }}>({p.steamId})</small>
            </li>
          ))}
        </ul>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>{t('inventory.loading')}</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{t('inventory.empty')}</p>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <PaintPreview key={p.id} paint={p} />
          ))}
        </div>
      )}
    </>
  )
}
