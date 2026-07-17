import { useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { ProgramDay, ProgramFull, WorkoutSessionFull } from '@shared/types'
import { EXERCISE_GROUPS } from './exerciseList'

interface DraftRow {
  exercise: string
  sets: string
  reps: string
  weight: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function WorkoutsPage(): ReactElement {
  const [sessions, setSessions] = useState<WorkoutSessionFull[]>([])
  const [programs, setPrograms] = useState<ProgramFull[]>([])
  const [date, setDate] = useState(today())
  const [name, setName] = useState('')
  const [draft, setDraft] = useState<DraftRow[]>([])
  const [addEx, setAddEx] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState('')

  async function refresh(): Promise<void> {
    setSessions(await window.api.workouts.listSessions())
    setPrograms(await window.api.program.list())
  }

  useEffect(() => {
    void refresh()
  }, [])

  const dayOptions = useMemo(
    () =>
      programs.flatMap((p) =>
        p.days.map((d) => ({ key: `${p.id}:${d.id}`, label: `${p.title} · ${d.name}`, day: d }))
      ),
    [programs]
  )

  function loadDay(day: ProgramDay): void {
    if (!name.trim()) setName(day.name)
    setDraft(
      day.entries.map((e) => ({
        exercise: e.exercise,
        sets: String(e.target_sets ?? 3),
        reps: e.target_reps != null ? String(e.target_reps) : '',
        weight: ''
      }))
    )
  }

  function addRow(): void {
    if (!addEx) {
      setError('Bir hareket seç.')
      return
    }
    setError(null)
    setDraft((p) => [...p, { exercise: addEx, sets: '3', reps: '', weight: '' }])
  }

  function updateRow(i: number, field: keyof DraftRow, val: string): void {
    setDraft((p) => p.map((r, x) => (x === i ? { ...r, [field]: val } : r)))
  }

  function rmRow(i: number): void {
    setDraft((p) => p.filter((_, x) => x !== i))
  }

  async function save(): Promise<void> {
    setError(null)
    if (!name.trim()) return setError('Antrenmana bir isim ver.')
    if (draft.length === 0) return setError('En az bir hareket ekle.')

    const entries = []
    for (const r of draft) {
      const s = parseInt(r.sets, 10)
      const rp = parseInt(r.reps, 10)
      const w = parseFloat(r.weight.replace(',', '.'))
      if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(rp) || rp <= 0 || !Number.isFinite(w)) {
        return setError(`"${r.exercise}" için set / tekrar / ağırlık eksik veya hatalı.`)
      }
      entries.push({ exercise: r.exercise, sets: s, reps: rp, weight_kg: w, note: null })
    }

    await window.api.workouts.addSession({ date, name: name.trim(), entries })
    setName('')
    setDraft([])
    await refresh()
  }

  async function delSession(id: number): Promise<void> {
    await window.api.workouts.deleteSession(id)
    await refresh()
  }

  const allEntries = useMemo(
    () =>
      sessions.flatMap((s) =>
        s.entries.map((e) => ({ date: s.date, exercise: e.exercise, weight: e.weight_kg }))
      ),
    [sessions]
  )
  const exercisesLogged = useMemo(() => [...new Set(allEntries.map((e) => e.exercise))], [allEntries])

  useEffect(() => {
    if (!selected && exercisesLogged.length > 0) setSelected(exercisesLogged[0])
  }, [exercisesLogged, selected])

  const progress = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of allEntries) {
      if (e.exercise !== selected) continue
      m.set(e.date, Math.max(m.get(e.date) ?? 0, e.weight))
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, w]) => ({ date: d, weight: w }))
  }, [allEntries, selected])


  return (
    <div className="workouts">
      <section className="panel">
        <h2>Yeni antrenman</h2>
        <div className="wform__grid">
          <label className="field">
            <span>Antrenman adı</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='ör. "Sırt + Biceps günü"'
            />
          </label>
          <label className="field">
            <span>Tarih</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          {dayOptions.length > 0 && (
            <label className="field">
              <span>Programdan yükle</span>
              <select
                className="select"
                value=""
                onChange={(e) => {
                  const opt = dayOptions.find((o) => o.key === e.target.value)
                  if (opt) loadDay(opt.day)
                }}
              >
                <option value="">— program günü seç —</option>
                {dayOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="wadd">
          <label className="field">
            <span>Tek hareket ekle</span>
            <select className="select" value={addEx} onChange={(e) => setAddEx(e.target.value)}>
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
          <button className="btn btn--ghost" type="button" onClick={addRow}>
            + Ekle
          </button>
        </div>

        {draft.length > 0 && (
          <div className="draft">
            <div className="draft__title">
              Hareketler ({draft.length}) — o gün yaptığın set / tekrar / ağırlığı gir
            </div>
            {draft.map((r, i) => (
              <div className="drow" key={i}>
                <span className="drow__ex">{r.exercise}</span>
                <input
                  className="drow__in"
                  type="number"
                  placeholder="set"
                  value={r.sets}
                  onChange={(e) => updateRow(i, 'sets', e.target.value)}
                />
                <input
                  className="drow__in"
                  type="number"
                  placeholder="tekrar"
                  value={r.reps}
                  onChange={(e) => updateRow(i, 'reps', e.target.value)}
                />
                <input
                  className="drow__in"
                  type="number"
                  step="0.5"
                  placeholder="kg"
                  value={r.weight}
                  onChange={(e) => updateRow(i, 'weight', e.target.value)}
                />
                <button className="btn btn--ghost" onClick={() => rmRow(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mform__error">{error}</p>}
        <button
          className="btn btn--primary"
          onClick={() => void save()}
          disabled={draft.length === 0 || !name.trim()}
        >
          Antrenmanı kaydet
        </button>
      </section>

      {exercisesLogged.length > 0 && (
        <section className="panel">
          <div className="panel__head">
            <h2>İlerleme — en yüksek ağırlık</h2>
            <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {exercisesLogged.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          {progress.length < 2 ? (
            <p className="empty">Bu hareket için grafik en az 2 farklı gün gerektiriyor.</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={progress} margin={{ top: 12, right: 24, bottom: 4, left: -8 }}>
                  <CartesianGrid stroke="#262c34" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#9aa4b2" fontSize={12} />
                  <YAxis stroke="#9aa4b2" fontSize={12} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      background: '#1d232b',
                      border: '1px solid #262c34',
                      borderRadius: 8,
                      color: '#e8eaed'
                    }}
                    formatter={(v) => [`${v} kg`, selected]}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#35c26b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <h2>Geçmiş antrenmanlar ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p className="empty">Henüz antrenman yok. Yukarıdan ilk antrenmanını oluştur.</p>
        ) : (
          <div className="wlog">
            {sessions.map((s) => (
              <div className="wday" key={s.id}>
                <div className="wsession__head">
                  <div>
                    <span className="wsession__name">{s.name}</span>
                    <span className="wsession__date">{s.date}</span>
                  </div>
                  <button className="btn btn--ghost" onClick={() => void delSession(s.id)}>
                    Sil
                  </button>
                </div>
                <div className="wday__sets">
                  {s.entries.map((e) => (
                    <div className="wset" key={e.id}>
                      <span className="wset__ex">{e.exercise}</span>
                      <span className="wset__val">
                        {e.sets} set × {e.reps} tekrar × {e.weight_kg} kg
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
