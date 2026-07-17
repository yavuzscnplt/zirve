import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

// Native derleme sorunlarından kaçınmak için SQLite'ı WASM (sql.js) ile
// çalıştırıyoruz. DB bellekte tutulur, her yazımdan sonra dosyaya kaydedilir.
// Kişisel uygulama olduğundan veri hacmi küçük; bu yaklaşım fazlasıyla yeterli.

let db: Database | null = null
let SQL: SqlJsStatic | null = null
let dbPath = ''

export async function initDb(): Promise<void> {
  const wasmPath = join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  SQL = await initSqlJs({ locateFile: () => wasmPath })

  dbPath = join(app.getPath('userData'), 'spor-kocu.db')
  db = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database()

  migrate(db)
  persist()
}

// Yedekten geri yükleme sonrası: diskteki dosyayı belleğe yeniden yükle.
export function reloadDb(): void {
  if (!SQL) throw new Error('Veritabanı başlatılmadı')
  db = new SQL.Database(readFileSync(dbPath))
  migrate(db)
  persist()
}

export function getDbPath(): string {
  return dbPath
}

export function getDb(): Database {
  if (!db) throw new Error('Veritabanı başlatılmadı')
  return db
}

// Bellekteki DB'yi diske yaz. Her ekle/sil sonrası çağrılır.
export function persist(): void {
  if (!db) return
  writeFileSync(dbPath, Buffer.from(db.export()))
}

function migrate(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      height_cm REAL,
      bmi REAL,
      body_fat_pct REAL,
      fat_mass_kg REAL,
      muscle_mass_kg REAL,
      bmr REAL,
      water_pct REAL,
      trunk_muscle_kg REAL,
      trunk_fat_pct REAL,
      right_leg_muscle_kg REAL,
      right_leg_fat_pct REAL,
      left_leg_muscle_kg REAL,
      left_leg_fat_pct REAL,
      right_arm_muscle_kg REAL,
      right_arm_fat_pct REAL,
      left_arm_muscle_kg REAL,
      left_arm_fat_pct REAL,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      pose TEXT NOT NULL,
      filename TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise TEXT NOT NULL,
      sets INTEGER NOT NULL DEFAULT 1,
      reps INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `)

  // Mevcut (eski) workout_sets tablosuna 'sets' sütununu ekle (yoksa).
  ensureColumn(database, 'workout_sets', 'sets', 'sets INTEGER NOT NULL DEFAULT 1')

  database.run(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS workout_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      report TEXT NOT NULL,
      photo_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      goals TEXT NOT NULL,
      days_per_week INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS program_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS program_day_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL,
      exercise TEXT NOT NULL,
      target_sets INTEGER,
      target_reps INTEGER,
      note TEXT,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS nutrition_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      goals TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS progress_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS template_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      exercise TEXT NOT NULL,
      target_sets INTEGER,
      target_reps INTEGER,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      target REAL NOT NULL,
      deadline TEXT,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS body_measures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      chest REAL,
      waist REAL,
      hip REAL,
      arm REAL,
      thigh REAL,
      calf REAL,
      neck REAL,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

function ensureColumn(
  database: Database,
  table: string,
  column: string,
  definition: string
): void {
  const info = database.exec(`PRAGMA table_info(${table})`)
  const exists = info.length > 0 && info[0].values.some((row) => row[1] === column)
  if (!exists) {
    database.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`)
  }
}
