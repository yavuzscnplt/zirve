import { useEffect, useState, type ReactElement } from 'react'
import type { Measurement, ProgressReview } from '@shared/types'

interface MetricDef {
  key: keyof Measurement
  label: string
  unit: string
  goodDown: boolean | null // düşüş iyi mi? (yağ↓ iyi, kas↑ iyi, null = nötr)
}

const METRICS: MetricDef[] = [
  { key: 'weight_kg', label: 'Kilo', unit: 'kg', goodDown: true },
  { key: 'body_fat_pct', label: 'Yağ oranı', unit: '%', goodDown: true },
  { key: 'fat_mass_kg', label: 'Yağ kütlesi', unit: 'kg', goodDown: true },
  { key: 'muscle_mass_kg', label: 'Kas', unit: 'kg', goodDown: false },
  { key: 'bmi', label: 'BMI', unit: '', goodDown: true },
  { key: 'water_pct', label: 'Su oranı', unit: '%', goodDown: null },
  { key: 'trunk_fat_pct', label: 'Gövde yağ', unit: '%', goodDown: true },
  { key: 'bmr', label: 'BMR', unit: 'kcal', goodDown: null }
]

export function ProgressPage(): ReactElement {
  const [ms, setMs] = useState<Measurement[]>([])
  const [reviews, setReviews] = useState<ProgressReview[]>([])
  const [fromId, setFromId] = useState<number | ''>('')
  const [toId, setToId] = useState<number | ''>('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const list = await window.api.measurements.list() // tarih azalan
      setMs(list)
      setReviews(await window.api.progress.listReviews())
      if (list.length >= 2) {
        setFromId(list[list.length - 1].id) // en eski
        setToId(list[0].id) // en yeni
      } else if (list.length === 1) {
        setToId(list[0].id)
      }
    })()
  }, [])

  const from = ms.find((m) => m.id === fromId)
  const to = ms.find((m) => m.id === toId)

  async function runReview(): Promise<void> {
    setBusy(true)
    try {
      await window.api.progress.review()
      setReviews(await window.api.progress.listReviews())
    } finally {
      setBusy(false)
    }
  }

  async function delReview(id: number): Promise<void> {
    await window.api.progress.deleteReview(id)
    setReviews(await window.api.progress.listReviews())
  }

  return (
    <div className="analysis">
      <section className="panel">
        <h2>İki ölçümü karşılaştır</h2>
        {ms.length < 2 ? (
          <p className="empty">Karşılaştırma için en az 2 ölçüm gerekli.</p>
        ) : (
          <>
            <div className="wform__grid">
              <label className="field">
                <span>Önceki</span>
                <select
                  className="select"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value ? Number(e.target.value) : '')}
                >
                  {ms.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.date}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Sonraki</span>
                <select
                  className="select"
                  value={toId}
                  onChange={(e) => setToId(e.target.value ? Number(e.target.value) : '')}
                >
                  {ms.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.date}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {from && to && (
              <div className="cmp">
                {METRICS.map((mt) => (
                  <CmpRow key={mt.key} metric={mt} from={from} to={to} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>📈 AI İlerleme Değerlendirmesi</h2>
          <button className="btn btn--primary" onClick={() => void runReview()} disabled={busy || ms.length === 0}>
            {busy ? 'Değerlendiriliyor…' : 'Değerlendir'}
          </button>
        </div>
        <p className="empty">
          AI tüm ölçüm geçmişini ve antrenman logunu inceleyip ilerlemeni değerlendirir ve sonraki
          adımları önerir.
        </p>
      </section>

      {reviews.map((r) => (
        <section className="panel" key={r.id}>
          <div className="panel__head">
            <h2>{new Date(r.created_at).toLocaleDateString('tr-TR')}</h2>
            <button className="btn btn--ghost" onClick={() => void delReview(r.id)}>
              Sil
            </button>
          </div>
          <div className="report">{r.content}</div>
        </section>
      ))}
    </div>
  )
}

function CmpRow({
  metric,
  from,
  to
}: {
  metric: MetricDef
  from: Measurement
  to: Measurement
}): ReactElement {
  const a = from[metric.key] as number | null
  const b = to[metric.key] as number | null
  const delta = a != null && b != null ? Number((b - a).toFixed(1)) : null

  let cls = 'cmp__delta'
  if (delta != null && delta !== 0 && metric.goodDown != null) {
    const good = (delta < 0 && metric.goodDown) || (delta > 0 && !metric.goodDown)
    cls += good ? ' good' : ' bad'
  }

  return (
    <div className="cmp__row">
      <span className="cmp__label">{metric.label}</span>
      <span className="cmp__val">
        {a ?? '—'} → <strong>{b ?? '—'}</strong> {metric.unit}
      </span>
      <span className={cls}>
        {delta == null ? '' : `${delta > 0 ? '▲ +' : '▼ '}${delta} ${metric.unit}`}
      </span>
    </div>
  )
}
