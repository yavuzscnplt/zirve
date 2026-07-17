import { getDb, persist } from './index'
import type { NutritionPlan } from '../../shared/types'

export function insertPlan(title: string, goals: string, content: string): NutritionPlan {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO nutrition_plans (title, goals, content, created_at) VALUES (?, ?, ?, ?)', [
    title,
    goals,
    content,
    now
  ])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return { id, title, goals, content, created_at: now }
}

export function listPlans(): NutritionPlan[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM nutrition_plans ORDER BY id DESC')
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<NutritionPlan>(res[0].columns, r))
}

export function getPlan(id: number): NutritionPlan | null {
  const db = getDb()
  const res = db.exec('SELECT * FROM nutrition_plans WHERE id = ?', [id])
  if (res.length === 0 || res[0].values.length === 0) return null
  return rowToObj<NutritionPlan>(res[0].columns, res[0].values[0])
}

export function deletePlan(id: number): void {
  const db = getDb()
  db.run('DELETE FROM nutrition_plans WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
