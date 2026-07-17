import { useEffect, useState, type ReactElement } from 'react'
import type { NutritionPlan } from '@shared/types'
import { Markdown } from '../../components/Markdown'

const GOALS = [
  'Yağ yakma',
  'Kilo verme',
  'Kas kazanma',
  'Rekomp (yağ yak + kas koru)',
  'Kilo koruma',
  'Kilo alma'
]
const ACTIVITIES = [
  'Hareketsiz',
  'Az aktif (haftada 1-2 gün)',
  'Orta aktif (3-4 gün)',
  'Çok aktif (5+ gün)'
]

export function NutritionPage(): ReactElement {
  const [plans, setPlans] = useState<NutritionPlan[]>([])
  const [goals, setGoals] = useState<Set<string>>(new Set(['Yağ yakma']))
  const [activity, setActivity] = useState(ACTIVITIES[2])
  const [meals, setMeals] = useState('4')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  async function refresh(): Promise<void> {
    setPlans(await window.api.nutrition.list())
    setActiveId((await window.api.nutrition.getActive())?.id ?? null)
  }

  async function setActive(id: number): Promise<void> {
    await window.api.nutrition.setActive(activeId === id ? null : id)
    await refresh()
  }

  useEffect(() => {
    void refresh()
  }, [])

  function toggleGoal(g: string): void {
    setGoals((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  async function generate(): Promise<void> {
    if (goals.size === 0) {
      setError('En az bir hedef seç.')
      return
    }
    const m = parseInt(meals, 10)
    if (!Number.isFinite(m) || m < 1 || m > 8) {
      setError('Öğün sayısı 1-8 olmalı.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await window.api.nutrition.generate({
        goals: [...goals],
        activity,
        mealsPerDay: m,
        note: note.trim() || null
      })
      await refresh()
    } catch (e) {
      setError((e as Error)?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number): Promise<void> {
    await window.api.nutrition.delete(id)
    await refresh()
  }

  return (
    <div className="analysis">
      <section className="panel">
        <div className="panel__head">
          <h2>🥗 AI Beslenme Programı</h2>
          <button
            className="btn btn--primary"
            onClick={() => void generate()}
            disabled={busy || goals.size === 0}
          >
            {busy ? 'Hazırlanıyor…' : 'Plan oluştur'}
          </button>
        </div>

        <div className="field">
          <span>Hedef(ler)</span>
          <div className="chips">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip ${goals.has(g) ? 'chip--on' : ''}`}
                onClick={() => toggleGoal(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="wform__grid">
          <label className="field">
            <span>Aktivite seviyesi</span>
            <select className="select" value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Günde kaç öğün</span>
            <input
              type="number"
              min={1}
              max={8}
              value={meals}
              onChange={(e) => setMeals(e.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span>Ek not (alerji, tercih: vejetaryen/laktozsuz, sevmediklerin vb.)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="opsiyonel"
          />
        </label>

        {error && <p className="mform__error">{error}</p>}
        {busy && <p className="empty">Plan hazırlanıyor — biraz sürebilir…</p>}
      </section>

      {plans.length === 0 && !busy ? (
        <section className="panel">
          <p className="empty">Henüz plan yok. Hedef seçip “Plan oluştur”a bas.</p>
        </section>
      ) : (
        plans.map((p) => (
          <section className="panel" key={p.id}>
            <div className="panel__head">
              <h2>
                {p.title} {activeId === p.id && <span className="badge">✓ Aktif</span>}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--ghost" onClick={() => void setActive(p.id)}>
                  {activeId === p.id ? 'Aktiften çıkar' : 'Aktif yap'}
                </button>
                <button className="btn btn--ghost" onClick={() => void remove(p.id)}>
                  Sil
                </button>
              </div>
            </div>
            <Markdown className="report" text={p.content} />
          </section>
        ))
      )}
    </div>
  )
}
