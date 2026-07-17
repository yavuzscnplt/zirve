import { getDb, persist } from './index'
import type {
  TemplateEntry,
  TemplateInput,
  WorkoutTemplate,
  WorkoutTemplateFull
} from '../../shared/types'

export function addTemplate(input: TemplateInput): WorkoutTemplateFull {
  const db = getDb()
  const now = new Date().toISOString()
  db.run('INSERT INTO templates (name, created_at) VALUES (?, ?)', [input.name, now])
  const templateId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number

  const entries: TemplateEntry[] = []
  input.entries.forEach((e, i) => {
    db.run(
      'INSERT INTO template_entries (template_id, exercise, target_sets, target_reps, position, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [templateId, e.exercise, e.target_sets, e.target_reps, i, now]
    )
    const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number
    entries.push({
      id,
      template_id: templateId,
      exercise: e.exercise,
      target_sets: e.target_sets,
      target_reps: e.target_reps
    })
  })

  persist()
  return { id: templateId, name: input.name, created_at: now, entries }
}

export function listTemplates(): WorkoutTemplateFull[] {
  const db = getDb()
  const tres = db.exec('SELECT * FROM templates ORDER BY id DESC')
  if (tres.length === 0) return []
  const templates = tres[0].values.map((r) => rowToObj<WorkoutTemplate>(tres[0].columns, r))

  return templates.map((t) => {
    const eres = db.exec(
      'SELECT * FROM template_entries WHERE template_id = ? ORDER BY position ASC, id ASC',
      [t.id]
    )
    const entries =
      eres.length > 0 ? eres[0].values.map((r) => rowToObj<TemplateEntry>(eres[0].columns, r)) : []
    return { ...t, entries }
  })
}

export function deleteTemplate(id: number): void {
  const db = getDb()
  db.run('DELETE FROM template_entries WHERE template_id = ?', [id])
  db.run('DELETE FROM templates WHERE id = ?', [id])
  persist()
}

function rowToObj<T>(columns: string[], row: Array<number | string | Uint8Array | null>): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((c, i) => {
    obj[c] = row[i]
  })
  return obj as unknown as T
}
