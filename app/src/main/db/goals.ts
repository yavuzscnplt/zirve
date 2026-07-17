import { getDb, persist } from './index'
import type { Goal, GoalInput } from '../../shared/types'

export function addGoal(input: GoalInput): Goal {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO goals (metric, target, deadline, created_at) VALUES (?, ?, ?, ?)', [
    input.metric,
    input.target,
    input.deadline,
    now
  ])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return { id, ...input, created_at: now }
}

export function listGoals(): Goal[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM goals ORDER BY id DESC')
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<Goal>(res[0].columns, r))
}

export function deleteGoal(id: number): void {
  const db = getDb()
  db.run('DELETE FROM goals WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
