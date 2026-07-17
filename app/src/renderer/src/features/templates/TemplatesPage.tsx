import { useEffect, useState, type ReactElement } from 'react'
import type { TemplateEntryInput, WorkoutTemplateFull } from '@shared/types'
import { EXERCISE_GROUPS } from '../workouts/exerciseList'

const GOALS = [
  'Kas kazanma',
  'Yağ yakma',
  'Kilo verme',
  'Omurga sağlığı (fıtık/skolyoz)',
  'Esneklik',
  'Patlayıcı güç',
  'Niş spor (basketbol/futbol/atletizm)'
]
const LEVELS = ['Başlangıç', 'Orta', 'İleri']

export function TemplatesPage(): ReactElement {
  const [templates, setTemplates] = useState<WorkoutTemplateFull[]>([])

  // AI üretimi
  const [goals, setGoals] = useState<Set<string>>(new Set(['Kas kazanma']))
  const [days, setDays] = useState('4')
  const [level, setLevel] = useState('Orta')
  const [note, setNote] = useState('')
  const [genBusy, setGenBusy] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  // Manuel
  const [name, setName] = useState('')
  const [draft, setDraft] = useState<TemplateEntryInput[]>([])
  const [exercise, setExercise] = useState('')
  const [tsets, setTsets] = useState('3')
  const [treps, setTreps] = useState('10')
  const [manError, setManError] = useState<string | null>(null)

  async function refresh(): Promise<void> {
    setTemplates(await window.api.templates.list())
  }

  useEffect(() => {
    void refresh()
  }, [])

  function toggleGoal(g: string): void {
    setGoals((p) => {
      const n = new Set(p)
      if (n.has(g)) n.delete(g)
      else n.add(g)
      return n
    })
  }

  async function genAI(): Promise<void> {
    if (goals.size === 0) return setGenError('En az bir hedef seç.')
    const d = parseInt(days, 10)
    if (!Number.isFinite(d) || d < 1 || d > 7) return setGenError('Gün sayısı 1-7 olmalı.')
    setGenBusy(true)
    setGenError(null)
    try {
      await window.api.templates.generate({
        goals: [...goals],
        daysPerWeek: d,
        level,
        note: note.trim() || null
      })
      await refresh()
    } catch (e) {
      setGenError((e as Error)?.message ?? String(e))
    } finally {
      setGenBusy(false)
    }
  }

  function addDraft(): void {
    setManError(null)
    if (!exercise) return setManError('Bir hareket seç.')
    setDraft((p) => [
      ...p,
      { exercise, target_sets: parseInt(tsets, 10) || null, target_reps: parseInt(treps, 10) || null }
    ])
  }

  function rmDraft(i: number): void {
    setDraft((p) => p.filter((_, x) => x !== i))
  }

  async function saveManual(): Promise<void> {
    setManError(null)
    if (!name.trim()) return setManError('Şablona bir isim ver.')
    if (draft.length === 0) return setManError('En az bir hareket ekle.')
    await window.api.templates.add({ name: name.trim(), entries: draft })
    setName('')
    setDraft([])
    await refresh()
  }

  async function del(id: number): Promise<void> {
    await window.api.templates.delete(id)
    await refresh()
  }

  return (
    <div className="workouts">
      <section className="panel">
        <div className="panel__head">
          <h2>🤖 AI ile şablon oluştur</h2>
          <button className="btn btn--primary" onClick={() => void genAI()} disabled={genBusy || goals.size === 0}>
            {genBusy ? 'Oluşturuluyor…' : 'Şablon oluştur'}
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
            <span>Haftada gün</span>
            <input type="number" min={1} max={7} value={days} onChange={(e) => setDays(e.target.value)} />
          </label>
          <label className="field">
            <span>Seviye</span>
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Ek not</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="opsiyonel" />
        </label>
        {genError && <p className="mform__error">{genError}</p>}
        {genBusy && <p className="empty">Şablonlar hazırlanıyor — biraz sürebilir…</p>}
      </section>

      <section className="panel">
        <h2>✍️ Kendin şablon oluştur</h2>
        <label className="field">
          <span>Şablon adı</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder='ör. "Sırt + Biceps"' />
        </label>
        <div className="wadd">
          <label className="field">
            <span>Hareket</span>
            <select className="select" value={exercise} onChange={(e) => setExercise(e.target.value)}>
              <option value="">— hareket seç —</option>
              {EXERCISE_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="wform__grid">
            <label className="field">
              <span>Hedef set</span>
              <input type="number" value={tsets} onChange={(e) => setTsets(e.target.value)} />
            </label>
            <label className="field">
              <span>Hedef tekrar</span>
              <input type="number" value={treps} onChange={(e) => setTreps(e.target.value)} />
            </label>
          </div>
          <button className="btn btn--ghost" type="button" onClick={addDraft}>
            + Hareketi ekle
          </button>
        </div>
        {draft.length > 0 && (
          <div className="draft">
            {draft.map((e, i) => (
              <div className="wset" key={i}>
                <span className="wset__ex">{e.exercise}</span>
                <span className="wset__val">
                  {e.target_sets ?? '—'} × {e.target_reps ?? '—'}
                </span>
                <button className="btn btn--ghost" onClick={() => rmDraft(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {manError && <p className="mform__error">{manError}</p>}
        <button
          className="btn btn--primary"
          onClick={() => void saveManual()}
          disabled={draft.length === 0 || !name.trim()}
        >
          Şablonu kaydet
        </button>
      </section>

      <section className="panel">
        <h2>Kayıtlı şablonlar ({templates.length})</h2>
        {templates.length === 0 ? (
          <p className="empty">Henüz şablon yok. Yukarıdan AI ile veya elle oluştur.</p>
        ) : (
          <div className="wlog">
            {templates.map((t) => (
              <div className="wday" key={t.id}>
                <div className="wsession__head">
                  <span className="wsession__name">{t.name}</span>
                  <button className="btn btn--ghost" onClick={() => void del(t.id)}>
                    Sil
                  </button>
                </div>
                <div className="wday__sets">
                  {t.entries.map((e) => (
                    <div className="wset" key={e.id}>
                      <span className="wset__ex">{e.exercise}</span>
                      <span className="wset__val">
                        {e.target_sets ?? '—'} × {e.target_reps ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
