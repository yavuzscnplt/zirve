import { getDb, persist } from './index'
import type {
  WorkoutEntry,
  WorkoutSession,
  WorkoutSessionFull,
  WorkoutSessionInput
} from '../../shared/types'

export function addSession(input: WorkoutSessionInput): WorkoutSessionFull {
  const db = getDb()
  const now = new Date().toISOString()

  db.run('INSERT INTO workout_sessions (date, name, created_at) VALUES (?, ?, ?)', [
    input.date,
    input.name,
    now
  ])
  // id'yi persist'ten ÖNCE oku (db.export last_insert_rowid'i sıfırlar).
  const sessionId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number

  const entries: WorkoutEntry[] = []
  for (const e of input.entries) {
    db.run(
      'INSERT INTO workout_entries (session_id, exercise, sets, reps, weight_kg, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sessionId, e.exercise, e.sets, e.reps, e.weight_kg, e.note, now]
    )
    const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
    entries.push({ id, session_id: sessionId, ...e, created_at: now })
  }

  persist()
  return { id: sessionId, date: input.date, name: input.name, created_at: now, entries }
}

export function listSessions(): WorkoutSessionFull[] {
  const db = getDb()
  const sres = db.exec('SELECT * FROM workout_sessions ORDER BY date DESC, id DESC')
  if (sres.length === 0) return []
  const sessions = sres[0].values.map((r) => rowToObj<WorkoutSession>(sres[0].columns, r))

  return sessions.map((s) => {
    const eres = db.exec('SELECT * FROM workout_entries WHERE session_id = ? ORDER BY id ASC', [
      s.id
    ])
    const entries =
      eres.length > 0 ? eres[0].values.map((r) => rowToObj<WorkoutEntry>(eres[0].columns, r)) : []
    return { ...s, entries }
  })
}

export function deleteSession(id: number): void {
  const db = getDb()
  db.run('DELETE FROM workout_entries WHERE session_id = ?', [id])
  db.run('DELETE FROM workout_sessions WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
