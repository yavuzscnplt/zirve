import { getDb, persist } from './index'
import type { Photo, PhotoPose } from '../../shared/types'

export function insertPhoto(
  date: string,
  pose: PhotoPose,
  filename: string,
  note: string | null
): Photo {
  const db = getDb()
  db.run('INSERT INTO photos (date, pose, filename, note, created_at) VALUES (?, ?, ?, ?, ?)', [
    date,
    pose,
    filename,
    note,
    new Date().toISOString()
  ])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return getPhoto(id) as Photo
}

export function getPhoto(id: number): Photo | null {
  const db = getDb()
  const res = db.exec('SELECT * FROM photos WHERE id = ?', [id])
  if (res.length === 0 || res[0].values.length === 0) return null
  return rowToPhoto(res[0].columns, res[0].values[0])
}

export function listPhotos(): Photo[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM photos ORDER BY date DESC, id DESC')
  if (res.length === 0) return []
  return res[0].values.map((row) => rowToPhoto(res[0].columns, row))
}

// Satırı siler, silinen dosyanın adını döndürür (dosyayı da silmek için).
export function deletePhotoRow(id: number): string | null {
  const db = getDb()
  const photo = getPhoto(id)
  db.run('DELETE FROM photos WHERE id = ?', [id])
  persist()
  return photo?.filename ?? null
}

function rowToPhoto(columns: string[], row: Array<number | string | Uint8Array | null>): Photo {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, i) => {
    obj[col] = row[i]
  })
  return obj as unknown as Photo
}
