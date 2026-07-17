import { getDb, persist } from './index'
import type { ProgressReview } from '../../shared/types'

export function insertReview(content: string): ProgressReview {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO progress_reviews (content, created_at) VALUES (?, ?)', [content, now])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return { id, content, created_at: now }
}

export function listReviews(): ProgressReview[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM progress_reviews ORDER BY id DESC')
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<ProgressReview>(res[0].columns, r))
}

export function deleteReview(id: number): void {
  const db = getDb()
  db.run('DELETE FROM progress_reviews WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
