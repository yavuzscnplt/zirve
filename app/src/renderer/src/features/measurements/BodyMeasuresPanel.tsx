import { useEffect, useState, type FormEvent, type ReactElement } from 'react'
import type { BodyMeasure } from '@shared/types'

const FIELDS: Array<{ key: keyof BodyMeasure; label: string }> = [
  { key: 'chest', label: 'Göğüs' },
  { key: 'waist', label: 'Bel' },
  { key: 'hip', label: 'Kalça' },
  { key: 'arm', label: 'Kol' },
  { key: 'thigh', label: 'Uyluk' },
  { key: 'calf', label: 'Baldır' },
  { key: 'neck', label: 'Boyun' }
]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function BodyMeasuresPanel(): ReactElement {
  const [items, setItems] = useState<BodyMeasure[]>([])
  const [date, setDate] = useState(today())
  const [vals, setVals] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function refresh(): Promise<void> {
    setItems(await window.api.bodyMeasures.list())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (!FIELDS.some((f) => vals[f.key as string])) return setError('En az bir çevre ölçüsü gir.')

    const input = { date, note: note.trim() || null } as Record<string, unknown>
    for (const f of FIELDS) {
      const raw = vals[f.key as string]
      const n = raw ? parseFloat(raw.replace(',', '.')) : NaN
      input[f.key as string] = Number.isFinite(n) ? n : null
    }
    await window.api.bodyMeasures.add(input as never)
    setVals({})
    setNote('')
    await refresh()
  }

  async function del(id: number): Promise<void> {
    await window.api.bodyMeasures.delete(id)
    await refresh()
  }

  return (
    <section className="panel">
      <h2>📏 Çevre ölçüleri (mezura · cm)</h2>
      <form className="mform" onSubmit={submit}>
        <label className="field">
          <span>Tarih</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="mform__grid">
          {FIELDS.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input
                type="number"
                step="0.1"
                value={vals[f.key as string] ?? ''}
                onChange={(e) => setVals((p) => ({ ...p, [f.key as string]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <label className="field">
          <span>Not</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="opsiyonel" />
        </label>
        {error && <p className="mform__error">{error}</p>}
        <button className="btn btn--primary" type="submit">
          Kaydet
        </button>
      </form>

      {items.length > 0 && (
        <div className="wlog" style={{ marginTop: 16 }}>
          {items.map((m) => (
            <div className="wset" key={m.id}>
              <span className="wset__ex">{m.date}</span>
              <span className="wset__val">
                {FIELDS.filter((f) => m[f.key] != null)
                  .map((f) => `${f.label} ${m[f.key]}`)
                  .join(' · ') || '—'}
              </span>
              <button className="btn btn--ghost" onClick={() => void del(m.id)}>
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
