import { getDb, persist } from './index'
import type { Program, ProgramDay, ProgramDayEntry, ProgramFull } from '../../shared/types'

export interface DayInput {
  name: string
  entries: Array<{
    exercise: string
    target_sets: number | null
    target_reps: number | null
    note: string | null
  }>
}

export function insertProgramFull(
  title: string,
  goals: string,
  daysPerWeek: number,
  content: string,
  days: DayInput[]
): ProgramFull {
  const db = getDb()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO programs (title, goals, days_per_week, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [title, goals, daysPerWeek, content, now]
  )
  const programId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number

  const outDays: ProgramDay[] = []
  days.forEach((d, di) => {
    db.run('INSERT INTO program_days (program_id, name, position, created_at) VALUES (?, ?, ?, ?)', [
      programId,
      d.name,
      di,
      now
    ])
    const dayId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
    const entries: ProgramDayEntry[] = []
    d.entries.forEach((e, ei) => {
      db.run(
        'INSERT INTO program_day_entries (day_id, exercise, target_sets, target_reps, note, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [dayId, e.exercise, e.target_sets, e.target_reps, e.note, ei, now]
      )
      const eid = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
      entries.push({
        id: eid,
        day_id: dayId,
        exercise: e.exercise,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        note: e.note
      })
    })
    outDays.push({ id: dayId, program_id: programId, name: d.name, entries })
  })

  persist()
  return { id: programId, title, goals, days_per_week: daysPerWeek, content, created_at: now, days: outDays }
}

export function listProgramsFull(): ProgramFull[] {
  const db = getDb()
  const pres = db.exec('SELECT * FROM programs ORDER BY id DESC')
  if (pres.length === 0) return []
  const programs = pres[0].values.map((r) => rowToObj<Program>(pres[0].columns, r))
  return programs.map((p) => ({ ...p, days: daysFor(p.id) }))
}

export function getProgramFull(id: number): ProgramFull | null {
  const db = getDb()
  const res = db.exec('SELECT * FROM programs WHERE id = ?', [id])
  if (res.length === 0 || res[0].values.length === 0) return null
  const p = rowToObj<Program>(res[0].columns, res[0].values[0])
  return { ...p, days: daysFor(p.id) }
}

function daysFor(programId: number): ProgramDay[] {
  const db = getDb()
  const dres = db.exec(
    'SELECT * FROM program_days WHERE program_id = ? ORDER BY position ASC, id ASC',
    [programId]
  )
  if (dres.length === 0) return []
  return dres[0].values.map((row) => {
    const d = rowToObj<{ id: number; program_id: number; name: string }>(dres[0].columns, row)
    const eres = db.exec(
      'SELECT * FROM program_day_entries WHERE day_id = ? ORDER BY position ASC, id ASC',
      [d.id]
    )
    const entries =
      eres.length > 0
        ? eres[0].values.map((r) => rowToObj<ProgramDayEntry>(eres[0].columns, r))
        : []
    return { id: d.id, program_id: d.program_id, name: d.name, entries }
  })
}

export function deleteProgram(id: number): void {
  const db = getDb()
  db.run(
    'DELETE FROM program_day_entries WHERE day_id IN (SELECT id FROM program_days WHERE program_id = ?)',
    [id]
  )
  db.run('DELETE FROM program_days WHERE program_id = ?', [id])
  db.run('DELETE FROM programs WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
