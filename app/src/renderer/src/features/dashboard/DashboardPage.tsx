import { useEffect, useMemo, useState, type ReactElement } from 'react'
import type { Goal, Measurement, NutritionPlan, ProgramFull, WorkoutSessionFull } from '@shared/types'
import { ProgramDays } from '../program/ProgramPage'

const GOAL_METRICS: Array<{ key: keyof Measurement; label: string; unit: string }> = [
  { key: 'weight_kg', label: 'Kilo', unit: 'kg' },
  { key: 'body_fat_pct', label: 'Yağ oranı', unit: '%' },
  { key: 'muscle_mass_kg', label: 'Kas', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'fat_mass_kg', label: 'Yağ kütlesi', unit: 'kg' }
]

function metricInfo(key: string): { label: string; unit: string } {
  return GOAL_METRICS.find((m) => m.key === key) ?? { label: key, unit: '' }
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

export function DashboardPage(): ReactElement {
  const [ms, setMs] = useState<Measurement[]>([])
  const [sessions, setSessions] = useState<WorkoutSessionFull[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [program, setProgram] = useState<ProgramFull | null>(null)
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null)
  const [allPrograms, setAllPrograms] = useState<ProgramFull[]>([])
  const [allPlans, setAllPlans] = useState<NutritionPlan[]>([])

  // hedef ekleme
  const [gMetric, setGMetric] = useState<string>('weight_kg')
  const [gTarget, setGTarget] = useState('')
  const [gDeadline, setGDeadline] = useState('')
  const [gError, setGError] = useState<string | null>(null)

  const [backupMsg, setBackupMsg] = useState<string | null>(null)

  async function refresh(): Promise<void> {
    setMs(await window.api.measurements.list())
    setSessions(await window.api.workouts.listSessions())
    setGoals(await window.api.goals.list())
    setProgram(await window.api.program.getActive())
    setNutrition(await window.api.nutrition.getActive())
    setAllPrograms(await window.api.program.list())
    setAllPlans(await window.api.nutrition.list())
  }

  async function chooseProgram(id: number | null): Promise<void> {
    await window.api.program.setActive(id)
    await refresh()
  }
  async function chooseNutrition(id: number | null): Promise<void> {
    await window.api.nutrition.setActive(id)
    await refresh()
  }

  useEffect(() => {
    void refresh()
  }, [])

  const asc = useMemo(() => [...ms].sort((a, b) => a.date.localeCompare(b.date)), [ms])
  const latest = ms[0]
  const first = asc[0]

  // Antrenman serisi
  const workoutDates = useMemo(() => [...new Set(sessions.map((s) => s.date))], [sessions])
  const thisWeekCount = useMemo(() => {
    const now = Date.now()
    return workoutDates.filter((d) => (now - new Date(d).getTime()) / 86400000 <= 7).length
  }, [workoutDates])
  const lastWorkout = workoutDates.sort().at(-1)

  function delta(key: keyof Measurement): number | null {
    if (!latest || !first) return null
    const a = first[key] as number | null
    const b = latest[key] as number | null
    return a != null && b != null ? Number((b - a).toFixed(1)) : null
  }

  async function addGoal(): Promise<void> {
    setGError(null)
    const t = parseFloat(gTarget.replace(',', '.'))
    if (!Number.isFinite(t)) return setGError('Hedef değeri gir.')
    await window.api.goals.add({ metric: gMetric, target: t, deadline: gDeadline || null })
    setGTarget('')
    setGDeadline('')
    await refresh()
  }

  async function delGoal(id: number): Promise<void> {
    await window.api.goals.delete(id)
    await refresh()
  }

  async function doExport(): Promise<void> {
    const ok = await window.api.backup.export()
    setBackupMsg(ok ? 'Yedek kaydedildi ✓' : null)
  }
  async function doImport(): Promise<void> {
    const ok = await window.api.backup.import()
    if (ok) {
      setBackupMsg('Yedek geri yüklendi ✓ — tam etki için uygulamayı yeniden başlat.')
      await refresh()
    }
  }

  function goalProjection(goal: Goal): { pct: number; text: string } {
    const key = goal.metric as keyof Measurement
    const series = asc
      .map((m) => ({ date: m.date, value: m[key] as number | null }))
      .filter((d): d is { date: string; value: number } => d.value != null)
    if (series.length === 0) return { pct: 0, text: 'Bu metrikte ölçüm yok.' }

    const startV = series[0].value
    const cur = series[series.length - 1]
    const pct =
      goal.target === startV ? 1 : Math.max(0, Math.min(1, (cur.value - startV) / (goal.target - startV)))

    const remaining = goal.target - cur.value
    if (Math.abs(remaining) < 0.05) return { pct: 1, text: 'Hedefe ulaşıldı 🎉' }

    const elapsed = daysBetween(series[0].date, cur.date)
    const rate = elapsed > 0 ? (cur.value - startV) / elapsed : 0
    if (rate === 0 || Math.sign(rate) !== Math.sign(remaining)) {
      return { pct, text: 'Mevcut gidişle hedefe yaklaşmıyorsun.' }
    }
    const etaDays = remaining / rate
    const eta = new Date(Date.now() + etaDays * 86400000)
    return {
      pct,
      text: `Bu hızla ~${eta.toLocaleDateString('tr-TR')} (${Math.round(etaDays)} gün)`
    }
  }

  return (
    <div className="dash">
      <div className="summary">
        <StatCard label="Kilo" value={latest?.weight_kg} unit="kg" d={delta('weight_kg')} goodDown />
        <StatCard label="Yağ oranı" value={latest?.body_fat_pct} unit="%" d={delta('body_fat_pct')} goodDown />
        <StatCard label="Kas" value={latest?.muscle_mass_kg} unit="kg" d={delta('muscle_mass_kg')} />
        <div className="scard">
          <span className="scard__label">Bu hafta antrenman</span>
          <span className="scard__value">{thisWeekCount}</span>
          <span className="scard__delta">
            {lastWorkout ? `Son: ${lastWorkout}` : 'Henüz antrenman yok'}
          </span>
        </div>
      </div>

      <section className="panel">
        <h2>🎯 Hedeflerim</h2>
        <div className="wform__grid">
          <label className="field">
            <span>Metrik</span>
            <select className="select" value={gMetric} onChange={(e) => setGMetric(e.target.value)}>
              {GOAL_METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Hedef değer</span>
            <input type="number" step="0.1" value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
          </label>
          <label className="field">
            <span>Tarih (opsiyonel)</span>
            <input type="date" value={gDeadline} onChange={(e) => setGDeadline(e.target.value)} />
          </label>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn--primary" onClick={() => void addGoal()}>
              Hedef ekle
            </button>
          </div>
        </div>
        {gError && <p className="mform__error">{gError}</p>}

        {goals.length === 0 ? (
          <p className="empty">Henüz hedef yok. Yukarıdan bir hedef ekle.</p>
        ) : (
          <div className="goals">
            {goals.map((g) => {
              const info = metricInfo(g.metric)
              const proj = goalProjection(g)
              return (
                <div className="goal" key={g.id}>
                  <div className="goal__head">
                    <strong>
                      {info.label} → {g.target} {info.unit}
                      {g.deadline ? ` · ${g.deadline}` : ''}
                    </strong>
                    <button className="btn btn--ghost" onClick={() => void delGoal(g.id)}>
                      Sil
                    </button>
                  </div>
                  <div className="goal__bar">
                    <div className="goal__fill" style={{ width: `${Math.round(proj.pct * 100)}%` }} />
                  </div>
                  <span className="goal__proj">
                    %{Math.round(proj.pct * 100)} · {proj.text}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="dash__two">
        <section className="panel">
          <div className="panel__head">
            <h2>📋 Aktif programım</h2>
            {allPrograms.length > 0 && (
              <select
                className="select"
                value={program?.id ?? ''}
                onChange={(e) => void chooseProgram(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— program seç —</option>
                {allPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          {program ? (
            <>
              <div className="active__title">{program.title}</div>
              {program.content && <p className="prog__overview">{program.content}</p>}
              <ProgramDays days={program.days} />
            </>
          ) : (
            <p className="empty">
              {allPrograms.length > 0
                ? 'Yukarıdan aktif programını seç.'
                : 'Önce Program sekmesinden bir program oluştur.'}
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>🥗 Aktif beslenmem</h2>
            {allPlans.length > 0 && (
              <select
                className="select"
                value={nutrition?.id ?? ''}
                onChange={(e) => void chooseNutrition(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— plan seç —</option>
                {allPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          {nutrition ? (
            <>
              <div className="active__title">{nutrition.title}</div>
              <div className="report">{nutrition.content}</div>
            </>
          ) : (
            <p className="empty">
              {allPlans.length > 0
                ? 'Yukarıdan aktif beslenme planını seç.'
                : 'Önce Beslenme sekmesinden bir plan oluştur.'}
            </p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2>💾 Yedekleme</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary" onClick={() => void doExport()}>
              Yedekle
            </button>
            <button className="btn btn--ghost" onClick={() => void doImport()}>
              Geri yükle
            </button>
          </div>
        </div>
        <p className="empty">
          Tüm verini (ölçüm, foto, log, program, sohbet…) tek dosyaya yedekle veya geri yükle.
          Veriler sadece bu cihazda tutulur — düzenli yedek al.
        </p>
        {backupMsg && <p className="active__title">{backupMsg}</p>}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  d,
  goodDown
}: {
  label: string
  value: number | null | undefined
  unit: string
  d: number | null
  goodDown?: boolean
}): ReactElement {
  let cls = 'scard__delta'
  if (d != null && d !== 0) {
    const good = (d < 0 && goodDown) || (d > 0 && !goodDown)
    cls += good ? ' up-good' : ' up-bad'
  }
  return (
    <div className="scard">
      <span className="scard__label">{label}</span>
      <span className="scard__value">
        {value ?? '—'} {unit}
      </span>
      {d != null && d !== 0 && (
        <span className={cls}>
          {d > 0 ? '▲ +' : '▼ '}
          {d} {unit} (baştan)
        </span>
      )}
    </div>
  )
}
