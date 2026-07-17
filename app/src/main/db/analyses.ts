import { getDb, persist } from './index'
import type { Analysis } from '../../shared/types'

export function insertAnalysis(date: string, report: string, photoCount: number): Analysis {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO analyses (date, report, photo_count, created_at) VALUES (?, ?, ?, ?)', [
    date,
    report,
    photoCount,
    now
  ])
  // id'yi persist()'ten ÖNCE oku — db.export() last_insert_rowid'i sıfırlar.
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return { id, date, report, photo_count: photoCount, created_at: now }
}

export function listAnalyses(): Analysis[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM analyses ORDER BY created_at DESC, id DESC')
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<Analysis>(res[0].columns, r))
}

export function deleteAnalysis(id: number): void {
  const db = getDb()
  db.run('DELETE FROM analyses WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
