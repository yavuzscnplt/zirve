import { loadSdk } from './sdk'
import { listMeasurements } from './db/measurements'
import { insertPlan } from './db/nutrition'
import type { Measurement, NutritionParams, NutritionPlan } from '../shared/types'

const NUTRITION_SYSTEM = `Sen bir sporcu beslenmesi uzmanısın. Kullanıcının ölçüm verilerine ve hedeflerine göre GÜNLÜK beslenme planı hazırlarsın.

Kurallar:
- Günlük kalori hedefini hesapla: BMR verildiyse onu kullan, aktivite seviyesine göre TDEE'ye çevir (hareketsiz ×1.2, az ×1.375, orta ×1.55, çok ×1.725), hedefe göre açık/fazla uygula (yağ yakma/kilo verme için ~%15-20 açık; kas/kilo alma için ~%10 fazla). Hesap mantığını 1-2 satırda göster.
- Makro dağılımı: protein / karbonhidrat / yağ — gram ve yaklaşık kalori. Protein kas koruma için vücut ağırlığına göre ~1.6-2.2 g/kg.
- Öğün örnekleri (istenen öğün sayısına göre): gerçekçi, Türk mutfağına uygun, miktar/porsiyonlarla. Toplam yaklaşık kaloriye denk gelsin.
- Su, lif ve pratik ipuçları.
- Kısıt/tercih (not) varsa uy (ör. laktoz, vejetaryen, alerji).
- ÖNEMLİ: Bu tıbbi/diyetisyen tavsiyesi DEĞİLDİR. Kronik rahatsızlık/alerji varsa uzmana danışılmalı — bunu belirt.
- Türkçe, net, markdown başlıklarla. Gereksiz uzatma.`

function fmt(v: number | null, u = ''): string {
  return v == null ? '—' : `${v}${u}`
}

function dataContext(): string {
  const ms = listMeasurements()
  if (!ms[0]) return 'Ölçüm verisi yok (kilo/BMR bilinmiyor — kullanıcıya ölçüm eklemesini öner).'
  const m: Measurement = ms[0]
  return (
    `Güncel ölçüm (${m.date}): kilo ${fmt(m.weight_kg, ' kg')}, boy ${fmt(m.height_cm, ' cm')}, ` +
    `BMI ${fmt(m.bmi)}, yağ ${fmt(m.body_fat_pct, '%')}, kas ${fmt(m.muscle_mass_kg, ' kg')}, ` +
    `BMR ${fmt(m.bmr, ' kcal')}`
  )
}

export async function generatePlan(params: NutritionParams): Promise<NutritionPlan> {
  const { query } = await loadSdk()
  const data = dataContext()
  const prompt = `Hedefler: ${params.goals.join(', ')}. Aktivite: ${params.activity}. Günde ${params.mealsPerDay} öğün.${
    params.note ? ` Ek not: ${params.note}` : ''
  }\n\nKullanıcı verisi:\n${data}\n\nBu bilgilere göre günlük beslenme planı hazırla.`

  let content = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: NUTRITION_SYSTEM,
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

  const title = `${params.goals.join(' + ')} · ${params.mealsPerDay} öğün`.slice(0, 80)
  return insertPlan(title, params.goals.join(', '), content || 'Plan üretilemedi.')
}
