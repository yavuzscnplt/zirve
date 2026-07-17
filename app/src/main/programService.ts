import { loadSdk } from './sdk'
import { listMeasurements } from './db/measurements'
import { listSessions } from './db/workouts'
import { insertProgramFull, type DayInput } from './db/programs'
import type { Measurement, ProgramFull, ProgramParams } from '../shared/types'

const PROGRAM_SYSTEM = `Sen deneyimli bir fitness antrenörüsün. Kullanıcının hedeflerine ve verisine göre HAFTALIK, uygulanabilir bir antrenman programı üretirsin.

Kurallar:
- Hedeflere ve haftalık gün sayısına uygun bir split kur (ör. 4 gün: itiş / çekiş / bacak / üst).
- Her gün için: gün adı ve hareketler (her hareket için hedef set, tekrar ve kısa not).
- Zayıf/dengesiz bölgelere (ör. kollar bacağa göre zayıfsa) ekstra hacim ver.
- Antrenman logundaki mevcut ağırlıkları referans al.
- Omurga sağlığı (fıtık/skolyoz) hedefteyse güvenli hareketler seç; overview'da doktor/fizyoterapist onayı gerektiğini belirt.
- Esneklik / patlayıcı güç / niş spor hedefleri varsa ilgili çalışmaları ekle.
- Hareket adlarını yaygın isimlerle yaz (Bench Press, Squat, Lat Pulldown gibi).

ÇOK ÖNEMLİ: Yanıtın SADECE geçerli JSON olsun — açıklama/markdown/kod bloğu YOK. Format:
{"overview":"2-4 cümlelik genel açıklama: split mantığı, progresyon, ısınma, kardiyo/dinlenme.","days":[{"name":"1. Gün — İtiş (Göğüs/Omuz/Triceps)","exercises":[{"exercise":"Bench Press (Barbell)","sets":4,"reps":8,"note":"progresif yük"}]}]}`

interface ParsedProgram {
  overview: string
  days: Array<{ name: string; exercises: Array<{ exercise: string; sets?: number; reps?: number; note?: string }> }>
}

function fmt(v: number | null, u = ''): string {
  return v == null ? '—' : `${v}${u}`
}

function dataContext(): string {
  const parts: string[] = []
  const ms = listMeasurements()
  if (ms[0]) {
    const m: Measurement = ms[0]
    parts.push(
      `Güncel ölçüm: kilo ${fmt(m.weight_kg, ' kg')}, yağ ${fmt(m.body_fat_pct, '%')}, kas ${fmt(m.muscle_mass_kg, ' kg')}; ` +
        `kol(kas) sağ ${fmt(m.right_arm_muscle_kg, ' kg')} sol ${fmt(m.left_arm_muscle_kg, ' kg')}, ` +
        `bacak(kas) sağ ${fmt(m.right_leg_muscle_kg, ' kg')} sol ${fmt(m.left_leg_muscle_kg, ' kg')}`
    )
  }
  const sessions = listSessions().slice(0, 6)
  if (sessions.length > 0) {
    parts.push(
      'Son antrenmanlar: ' +
        sessions
          .map((s) => `${s.name} [${s.entries.map((e) => `${e.exercise} ${e.weight_kg}kg`).join('; ')}]`)
          .join(' | ')
    )
  }
  return parts.join('\n') || 'Veri yok.'
}

function parseProgram(text: string): ParsedProgram {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI geçerli program üretmedi, tekrar dene.')
  const obj = JSON.parse(t.slice(start, end + 1))
  if (!obj || !Array.isArray(obj.days)) throw new Error('AI geçerli program üretmedi, tekrar dene.')
  return { overview: typeof obj.overview === 'string' ? obj.overview : '', days: obj.days }
}

export async function generateProgram(params: ProgramParams): Promise<ProgramFull> {
  const { query } = await loadSdk()
  const data = dataContext()
  const prompt = `Hedefler: ${params.goals.join(', ')}. Haftada ${params.daysPerWeek} gün. Seviye: ${params.level}.${
    params.note ? ` Ek not: ${params.note}` : ''
  }\n\nKullanıcı verisi:\n${data}\n\n${params.daysPerWeek} günlük yapılandırılmış program üret. SADECE JSON döndür.`

  let result = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: PROGRAM_SYSTEM,
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

  const parsed = parseProgram(result)
  const days: DayInput[] = parsed.days
    .filter((d) => d && d.name && Array.isArray(d.exercises))
    .map((d) => ({
      name: d.name,
      entries: d.exercises.map((e) => ({
        exercise: e.exercise,
        target_sets: e.sets ?? null,
        target_reps: e.reps ?? null,
        note: e.note ?? null
      }))
    }))

  const title = `${params.goals.join(' + ')} · ${params.daysPerWeek} gün`.slice(0, 80)
  return insertProgramFull(title, params.goals.join(', '), params.daysPerWeek, parsed.overview, days)
}
