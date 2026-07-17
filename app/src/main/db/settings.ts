import { getDb, persist } from './index'

export function setSetting(key: string, value: string | null): void {
  const db = getDb()
  if (value === null) {
    db.run('DELETE FROM settings WHERE key = ?', [key])
  } else {
    db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    )
  }
  persist()
}

export function getSetting(key: string): string | null {
  const db = getDb()
  const res = db.exec('SELECT value FROM settings WHERE key = ?', [key])
  if (res.length === 0 || res[0].values.length === 0) return null
  return res[0].values[0][0] as string | null
}
