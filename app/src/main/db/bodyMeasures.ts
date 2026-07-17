import { getDb, persist } from './index'
import type { BodyMeasure, BodyMeasureInput } from '../../shared/types'

const COLS: Array<keyof BodyMeasureInput> = [
  'date',
  'chest',
  'waist',
  'hip',
  'arm',
  'thigh',
  'calf',
  'neck',
  'note'
]

export function addBodyMeasure(input: BodyMeasureInput): BodyMeasure {
  const db = getDb()
  const now = new Date().toISOString()
  const columns = [...COLS, 'created_at']
  const placeholders = columns.map(() => '?').join(', ')
  const values = [...COLS.map((c) => input[c] ?? null), now]
  db.run(`INSERT INTO body_measures (${columns.join(', ')}) VALUES (${placeholders})`, values)
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return { id, ...input, created_at: now }
}

export function listBodyMeasures(): BodyMeasure[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM body_measures ORDER BY date DESC, id DESC')
  if (res.length === 0) return []
  return res[0].values.map((r) => rowToObj<BodyMeasure>(res[0].columns, r))
}

export function deleteBodyMeasure(id: number): void {
  const db = getDb()
  db.run('DELETE FROM body_measures WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
