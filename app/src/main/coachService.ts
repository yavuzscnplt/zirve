import { listMeasurements } from './db/measurements'
import { listPhotos } from './db/photos'
import { listSessions } from './db/workouts'
import { addMessage, listMessages, setChatTitle } from './db/chats'
import { loadSdk } from './sdk'
import type { ChatTurn, Measurement } from '../shared/types'

const COACH_SYSTEM = `Sen Yavuz'un kişisel fitness ve beslenme koçusun. Alanında uzmanlaşmış, güncel ve kanıta dayalı bilgiye sahipsin.

Görevin: Yavuz'un ölçüm, antrenman ve fotoğraf verilerine ve hedeflerine göre kişisel, somut, uygulanabilir tavsiyeler vermek — antrenman, beslenme ve ilerleme takibi.

Kurallar:
- Türkçe, samimi ama profesyonel konuş.
- Sana verilen verilere dayan; ilgili sayılara atıfta bulun.
- Antrenman logundaki ağırlık/tekrar artışını (progresif yük) yorumla.
- Bölgesel dengesizlikleri (kol/bacak/gövde) fark edersen belirt.
- Somut ve uygulanabilir ol; genel geçer laf etme.
- Tıbbi teşhis KOYMA; ciddi bir şey sezersen kibarca doktora yönlendir.
- Gereksiz uzatma; net ve öncelikli ol.
- Hedef belirsizse kullanıcıya hedefini sor (kas kazanma / yağ yakma / kilo verme / omurga sağlığı / esneklik / patlayıcı güç / niş spor).`

function fmt(value: number | null, unit = ''): string {
  return value == null ? '—' : `${value}${unit}`
}

function measurementLine(m: Measurement): string {
  return (
    `- ${m.date}: kilo ${fmt(m.weight_kg, ' kg')}, BMI ${fmt(m.bmi)}, ` +
    `yağ ${fmt(m.body_fat_pct, '%')} (${fmt(m.fat_mass_kg, ' kg')}), ` +
    `kas ${fmt(m.muscle_mass_kg, ' kg')}, BMR ${fmt(m.bmr, ' kcal')}, su ${fmt(m.water_pct, '%')}; ` +
    `gövde ${fmt(m.trunk_muscle_kg, ' kg')}/${fmt(m.trunk_fat_pct, '%')}, ` +
    `bacak(kas) sağ ${fmt(m.right_leg_muscle_kg, ' kg')} sol ${fmt(m.left_leg_muscle_kg, ' kg')}, ` +
    `kol(kas) sağ ${fmt(m.right_arm_muscle_kg, ' kg')} sol ${fmt(m.left_arm_muscle_kg, ' kg')}`
  )
}

function buildDataContext(): string {
  const parts: string[] = []

  const measurements = listMeasurements()
  if (measurements.length === 0) {
    parts.push('Ölçüm: henüz kayıt yok (kullanıcıya ölçüm eklemesini öner).')
  } else {
    parts.push('ÖLÇÜM GEÇMİŞİ (yeniden eskiye):\n' + measurements.map(measurementLine).join('\n'))
  }

  const sessions = listSessions().slice(0, 12)
  if (sessions.length > 0) {
    const lines = sessions
      .map((s) => {
        const ex = s.entries
          .map((e) => `${e.exercise} ${e.sets}×${e.reps}×${e.weight_kg}kg`)
          .join(', ')
        return `- ${s.date} · ${s.name}: ${ex}`
      })
      .join('\n')
    parts.push('SON ANTRENMANLAR (yeniden eskiye):\n' + lines)
  }

  const photos = listPhotos()
  if (photos.length > 0) {
    const dates = [...new Set(photos.map((p) => p.date))].join(', ')
    parts.push(`FOTOĞRAF: ${photos.length} poz fotoğrafı kayıtlı (tarihler: ${dates}).`)
  }

  return parts.join('\n\n')
}

async function generateReply(history: ChatTurn[], message: string): Promise<string> {
  const { query } = await loadSdk()
  const data = buildDataContext()
  const convo = history
    .map((t) => `${t.role === 'user' ? 'Kullanıcı' : 'Koç'}: ${t.text}`)
    .join('\n')
  const prompt = `KULLANICI VERİSİ:\n${data}\n\n${convo ? `ÖNCEKİ KONUŞMA:\n${convo}\n\n` : ''}Kullanıcı: ${message}`

  let result = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: COACH_SYSTEM,
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
  return result || 'Şu an bir yanıt üretemedim, tekrar dener misin?'
}

// Bir sohbete mesaj gönderir: geçmişi yükler, yanıt üretir, ikisini de saklar.
export async function askCoach(chatId: number, message: string): Promise<string> {
  const prior = listMessages(chatId)
  addMessage(chatId, 'user', message)
  if (prior.length === 0) {
    setChatTitle(chatId, message) // ilk mesaj sohbet başlığı olur
  }

  const history: ChatTurn[] = prior.map((m) => ({ role: m.role, text: m.text }))
  const reply = await generateReply(history, message)
  addMessage(chatId, 'coach', reply)
  return reply
}
