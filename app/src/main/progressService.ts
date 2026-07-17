import { loadSdk } from './sdk'
import { listMeasurements } from './db/measurements'
import { listSessions } from './db/workouts'
import { insertReview } from './db/progress'
import type { Measurement, ProgressReview } from '../shared/types'

const PROGRESS_SYSTEM = `Sen bir fitness ilerleme değerlendirme uzmanısın. Kullanıcının ölçüm geçmişini ve antrenman logunu incele.

Raporda şunları ver (Türkçe, net, markdown):
- Trend özeti: kilo, yağ oranı, kas nasıl değişmiş (ilk → son). Sayılara ve yönlere atıfta bulun.
- İyi giden ve kötü giden noktalar.
- Antrenman logundan progresif yük (ağırlık artışı) gözlemleri.
- Hedefe göre nerede olduğu ve SOMUT sonraki adımlar (öncelikli).
- Kısa motive edici kapanış.

Gereksiz uzatma. Tıbbi teşhis koyma.`

function fmt(v: number | null, u = ''): string {
  return v == null ? '—' : `${v}${u}`
}

function dataContext(): string {
  const parts: string[] = []
  const ms = listMeasurements() // yeniden eskiye
  if (ms.length === 0) {
    parts.push('Ölçüm yok.')
  } else {
    const lines = ms
      .map(
        (m: Measurement) =>
          `- ${m.date}: kilo ${fmt(m.weight_kg, ' kg')}, BMI ${fmt(m.bmi)}, yağ ${fmt(
            m.body_fat_pct,
            '%'
          )}, kas ${fmt(m.muscle_mass_kg, ' kg')}`
      )
      .join('\n')
    parts.push('ÖLÇÜM GEÇMİŞİ (yeniden eskiye):\n' + lines)
  }

  const sessions = listSessions().slice(0, 10)
  if (sessions.length > 0) {
    parts.push(
      'SON ANTRENMANLAR:\n' +
        sessions
          .map(
            (s) =>
              `- ${s.date} ${s.name}: ${s.entries
                .map((e) => `${e.exercise} ${e.sets}×${e.reps}×${e.weight_kg}kg`)
                .join(', ')}`
          )
          .join('\n')
    )
  }
  return parts.join('\n\n')
}

export async function generateReview(): Promise<ProgressReview> {
  const { query } = await loadSdk()
  const data = dataContext()
  const prompt = `Kullanıcı verisi:\n${data}\n\nİlerlememi değerlendir ve sonraki adımları öner.`

  let content = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: PROGRESS_SYSTEM,
      settingSources: [],
      allowedTools: [],
      maxTurns: 1,
      model: 'claude-opus-4-8'
    }
  })) {
    if ('result' in msg && typeof msg.result === 'string') {
      content = msg.result
    }
  }

  return insertReview(content || 'Değerlendirme üretilemedi.')
}
