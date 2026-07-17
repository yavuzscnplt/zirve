import { useEffect, useState, type ReactElement } from 'react'
import type { ProgramDay, ProgramFull } from '@shared/types'

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

export function ProgramPage(): ReactElement {
  const [programs, setPrograms] = useState<ProgramFull[]>([])
  const [goals, setGoals] = useState<Set<string>>(new Set(['Yağ yakma']))
  const [days, setDays] = useState('4')
  const [level, setLevel] = useState('Orta')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  async function refresh(): Promise<void> {
    setPrograms(await window.api.program.list())
    setActiveId((await window.api.program.getActive())?.id ?? null)
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

  async function generate(): Promise<void> {
    if (goals.size === 0) return setError('En az bir hedef seç.')
    const d = parseInt(days, 10)
    if (!Number.isFinite(d) || d < 1 || d > 7) return setError('Gün sayısı 1-7 olmalı.')
    setBusy(true)
    setError(null)
    try {
      await window.api.program.generate({
        goals: [...goals],
        daysPerWeek: d,
        level,
        note: note.trim() || null
      })
      await refresh()
    } catch (e) {
      setError((e as Error)?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  async function setActive(id: number): Promise<void> {
    await window.api.program.setActive(activeId === id ? null : id)
    await refresh()
  }

  async function remove(id: number): Promise<void> {
    await window.api.program.delete(id)
    await refresh()
  }

  return (
    <div className="analysis">
      <section className="panel">
        <div className="panel__head">
          <h2>📋 AI Antrenman Programı</h2>
          <button className="btn btn--primary" onClick={() => void generate()} disabled={busy || goals.size === 0}>
            {busy ? 'Hazırlanıyor…' : 'Program oluştur'}
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
            <span>Haftada kaç gün</span>
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
          <span>Ek not (sakatlık, ekipman, spor dalı)</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="opsiyonel" />
        </label>
        {error && <p className="mform__error">{error}</p>}
        {busy && <p className="empty">Program hazırlanıyor — biraz sürebilir…</p>}
        <p className="empty">
          İpucu: Programı “Aktif yap” dersen Ana Sayfa'da görünür; Antrenman sekmesinde
          “Programdan yükle” ile bu programın günlerini loga tek tıkla getirirsin.
        </p>
      </section>

      {programs.length === 0 && !busy ? (
        <section className="panel">
          <p className="empty">Henüz program yok. Hedef seçip “Program oluştur”a bas.</p>
        </section>
      ) : (
        programs.map((p) => (
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
            {p.content && <p className="prog__overview">{p.content}</p>}
            <ProgramDays days={p.days} />
          </section>
        ))
      )}
    </div>
  )
}

export function ProgramDays({ days }: { days: ProgramDay[] }): ReactElement {
  if (days.length === 0) return <p className="empty">Bu programda yapılandırılmış gün yok.</p>
  return (
    <div className="progdays">
      {days.map((d) => (
        <div className="progday" key={d.id}>
          <div className="progday__name">{d.name}</div>
          <div className="wday__sets">
            {d.entries.map((e) => (
              <div className="wset" key={e.id}>
                <span className="wset__ex">{e.exercise}</span>
                <span className="wset__val">
                  {e.target_sets ?? '—'} × {e.target_reps ?? '—'}
                </span>
                {e.note && <span className="wset__note">{e.note}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
