import { getDb, persist } from './index'
import type { Measurement, MeasurementInput } from '../../shared/types'

// created_at ve id dışında DB'ye yazılan tüm sütunlar (MeasurementInput sırası).
const INPUT_COLUMNS: Array<keyof MeasurementInput> = [
  'date',
  'weight_kg',
  'height_cm',
  'bmi',
  'body_fat_pct',
  'fat_mass_kg',
  'muscle_mass_kg',
  'bmr',
  'water_pct',
  'trunk_muscle_kg',
  'trunk_fat_pct',
  'right_leg_muscle_kg',
  'right_leg_fat_pct',
  'left_leg_muscle_kg',
  'left_leg_fat_pct',
  'right_arm_muscle_kg',
  'right_arm_fat_pct',
  'left_arm_muscle_kg',
  'left_arm_fat_pct',
  'note'
]

export function addMeasurement(input: MeasurementInput): Measurement {
  const db = getDb()
  const columns = [...INPUT_COLUMNS, 'created_at']
  const placeholders = columns.map(() => '?').join(', ')
  const values = [
    ...INPUT_COLUMNS.map((col) => input[col] ?? null),
    new Date().toISOString()
  ]

  db.run(`INSERT INTO measurements (${columns.join(', ')}) VALUES (${placeholders})`, values)
  // id'yi persist()'ten ÖNCE oku — db.export() last_insert_rowid'i sıfırlar.
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
  persist()
  return getMeasurement(id) as Measurement
}

export function listMeasurements(): Measurement[] {
  const db = getDb()
  const res = db.exec('SELECT * FROM measurements ORDER BY date DESC, id DESC')
  if (res.length === 0) return []
  return res[0].values.map((row) => rowToMeasurement(res[0].columns, row))
}

export function getMeasurement(id: number): Measurement | null {
  const db = getDb()
  const res = db.exec('SELECT * FROM measurements WHERE id = ?', [id])
  if (res.length === 0 || res[0].values.length === 0) return null
  return rowToMeasurement(res[0].columns, res[0].values[0])
}

export function deleteMeasurement(id: number): void {
  const db = getDb()
  db.run('DELETE FROM measurements WHERE id = ?', [id])
  persist()
}

export function countMeasurements(): number {
  const db = getDb()
  const res = db.exec('SELECT COUNT(*) AS n FROM measurements')
  return res[0].values[0][0] as number
}

// Bilinen tartı ölçümleri (tarih bazlı seed edilir). Kişiye özel geçmiş
// veriler bu PUBLIC kopyada bilinçli olarak boş bırakılmıştır; kullanıcı
// kendi ölçümlerini Ölçümler ekranından ekler. (Özel çalışma kopyasında bu
// dizi kullanıcının gerçek baseline verisiyle doldurulur.)
const REFERENCE_MEASUREMENTS: MeasurementInput[] = []

function hasMeasurementOnDate(date: string): boolean {
  const db = getDb()
  const res = db.exec('SELECT 1 FROM measurements WHERE date = ? LIMIT 1', [date])
  return res.length > 0 && res[0].values.length > 0
}

// Bilinen referans ölçümlerden DB'de olmayanları ekler (tarih bazlı, tekrarlamaz).
export function seedBaseline(): void {
  for (const ref of REFERENCE_MEASUREMENTS) {
    if (!hasMeasurementOnDate(ref.date)) addMeasurement(ref)
  }
}

function rowToMeasurement(columns: string[], row: Array<number | string | Uint8Array | null>): Measurement {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, i) => {
    obj[col] = row[i]
  })
  return obj as unknown as Measurement
}
