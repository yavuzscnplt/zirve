import { loadSdk } from './sdk'
import { listMeasurements } from './db/measurements'
import { addTemplate } from './db/templates'
import type { Measurement, TemplateGenParams, WorkoutTemplateFull } from '../shared/types'

const TEMPLATE_SYSTEM = `Sen bir fitness antrenörüsün. Kullanıcının hedeflerine ve haftalık gün sayısına göre antrenman ŞABLONLARI üretirsin.

Her gün için bir şablon: gün adı ve o günün hareket listesi (her hareket için hedef set ve tekrar). Zayıf/dengesiz bölgelere ekstra hacim ver. Hareket adlarını yaygın isimlerle yaz (Bench Press, Squat, Lat Pulldown gibi).

ÇOK ÖNEMLİ: Yanıtın SADECE geçerli JSON olsun — açıklama, markdown, kod bloğu YOK. Tam olarak bu formatta bir dizi döndür:
[
  {"name":"1. Gün — İtiş","exercises":[{"exercise":"Bench Press (Barbell)","sets":4,"reps":8},{"exercise":"Overhead Press (Dumbbell)","sets":3,"reps":10}]},
  {"name":"2. Gün — Çekiş","exercises":[{"exercise":"Lat Pulldown","sets":4,"reps":10}]}
]`

interface ParsedDay {
  name: string
  exercises: Array<{ exercise: string; sets?: number; reps?: number }>
}

function fmt(v: number | null, u = ''): string {
  return v == null ? '—' : `${v}${u}`
}

function dataContext(): string {
  const ms = listMeasurements()
  if (!ms[0]) return 'Ölçüm verisi yok.'
  const m: Measurement = ms[0]
  return (
    `Güncel ölçüm: kilo ${fmt(m.weight_kg, ' kg')}, yağ ${fmt(m.body_fat_pct, '%')}, ` +
    `kas ${fmt(m.muscle_mass_kg, ' kg')}; kol(kas) sağ ${fmt(m.right_arm_muscle_kg, ' kg')} sol ${fmt(m.left_arm_muscle_kg, ' kg')}, ` +
    `bacak(kas) sağ ${fmt(m.right_leg_muscle_kg, ' kg')} sol ${fmt(m.left_leg_muscle_kg, ' kg')}`
  )
}

function parseTemplates(text: string): ParsedDay[] {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('[')
  const end = t.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('AI geçerli şablon üretmedi, tekrar dene.')
  const arr = JSON.parse(t.slice(start, end + 1))
  if (!Array.isArray(arr)) throw new Error('AI geçerli şablon üretmedi, tekrar dene.')
  return arr.filter(
    (d): d is ParsedDay => d && typeof d.name === 'string' && Array.isArray(d.exercises)
  )
}

export async function generateTemplates(params: TemplateGenParams): Promise<WorkoutTemplateFull[]> {
  const { query } = await loadSdk()
  const data = dataContext()
  const prompt = `Hedefler: ${params.goals.join(', ')}. Haftada ${params.daysPerWeek} gün. Seviye: ${params.level}.${
    params.note ? ` Not: ${params.note}` : ''
  }\n\nKullanıcı verisi:\n${data}\n\n${params.daysPerWeek} günlük şablon seti üret. SADECE JSON döndür.`

  let result = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: TEMPLATE_SYSTEM,
      settingSources: [],
      allowedTools: [],
      maxTurns: 1,
      model: 'claude-opus-4-8'
    }
  })) {
    if ('result' in msg && typeof msg.result === 'string') {
      result = msg.result
    }
  }

  const days = parseTemplates(result)
  return saveDays(days)
}

// Var olan bir program metnini (serbest metin) şablon(lar)a çevirir.
export async function templatesFromText(text: string): Promise<WorkoutTemplateFull[]> {
  const { query } = await loadSdk()
  const prompt = `Aşağıdaki antrenman programını şablonlara çevir: her antrenman gününü ayrı bir şablon yap; hareketleri ve set/tekrar hedeflerini programdan çıkar. SADECE JSON döndür.\n\nPROGRAM:\n${text}`

  let result = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: TEMPLATE_SYSTEM,
      settingSources: [],
      allowedTools: [],
      maxTurns: 1,
      model: 'claude-opus-4-8'
    }
  })) {
    if ('result' in msg && typeof msg.result === 'string') {
      result = msg.result
    }
  }

  return saveDays(parseTemplates(result))
}

function saveDays(days: ParsedDay[]): WorkoutTemplateFull[] {
  return days.map((day) =>
    addTemplate({
      name: day.name,
      entries: day.exercises.map((e) => ({
        exercise: e.exercise,
        target_sets: e.sets ?? null,
        target_reps: e.reps ?? null
      }))
    })
  )
}
