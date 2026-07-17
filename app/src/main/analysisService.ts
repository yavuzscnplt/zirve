import { loadSdk } from './sdk'
import { listPhotos } from './db/photos'
import { listMeasurements } from './db/measurements'
import { insertAnalysis } from './db/analyses'
import { photosDir } from './photoService'
import type { Analysis, Measurement } from '../shared/types'

const ANALYSIS_SYSTEM = `Sen deneyimli bir fitness vücut analizi uzmanısın. Sana verilen poz fotoğraflarını Read aracıyla oku ve ölçüm verileriyle birlikte değerlendir.

TARİH — ÇOK ÖNEMLİ: Her fotoğrafın ÜZERİNDE genellikle bir tarih YAZILIDIR (kullanıcı elle eklemiştir). Her görseli okurken bu yazılı tarihi bul ve fotoğrafın GERÇEK tarihi olarak onu kullan. Sistemdeki dosya bilgisi güvenilmez olabilir (hepsi aynı görünebilir), ona güvenme. Fotoğrafları bu yazılı tarihlere göre eskiden yeniye kendin sırala.

Fotoğraflar farklı dönemlerden gelebilir; bazıları kullanıcının daha eski "fit" hâli olabilir. Güncel hâli geçmişle karşılaştır.

Raporu şu başlıklarla, Türkçe ve net ver:
1. Somatotip tahmini (ektomorf / mezomorf / endomorf; baskın kombinasyon).
2. Genel kompozisyon ve yağ dağılımı (nerede yoğunlaşmış).
3. Duruş ve simetri (belirgin sağ-sol veya ön-arka dengesizlik varsa).
4. Geçmişle karşılaştırma: eski fit hâline göre ne değişmiş (ilerleme/gerileme). Eski fit hâlini gerçekçi bir HEDEF olarak kullan.
5. Öncelikli geliştirilecek bölgeler (önem sırasıyla).
6. Kısa özet ve ilk adım önerisi.

ÖNEMLİ: Fotoğraf ve tartı verisi TAHMİNE dayalıdır, tıbbi ölçüm/teşhis değildir — raporun başında bunu kısaca belirt. Abartma; gözleme dayalı, dürüst konuş.`

function measurementSummary(m: Measurement): string {
  const f = (v: number | null, u = ''): string => (v == null ? '—' : `${v}${u}`)
  return (
    `Tarih ${m.date}: kilo ${f(m.weight_kg, ' kg')}, BMI ${f(m.bmi)}, yağ ${f(m.body_fat_pct, '%')}, ` +
    `kas ${f(m.muscle_mass_kg, ' kg')}; gövde yağ ${f(m.trunk_fat_pct, '%')}, ` +
    `kol(kas) sağ ${f(m.right_arm_muscle_kg, ' kg')} sol ${f(m.left_arm_muscle_kg, ' kg')}, ` +
    `bacak(kas) sağ ${f(m.right_leg_muscle_kg, ' kg')} sol ${f(m.left_leg_muscle_kg, ' kg')}`
  )
}

export async function runAnalysis(photoIds: number[]): Promise<Analysis> {
  const chosen = listPhotos().filter((p) => photoIds.includes(p.id))
  if (chosen.length === 0) {
    throw new Error('Analiz için en az bir fotoğraf seç.')
  }
  // Seçilenleri kronolojik sırala (eskiden yeniye) — AI ilerlemeyi tarihe göre görsün.
  chosen.sort((a, b) => a.date.localeCompare(b.date))

  const fileLines = chosen.map((p) => `- ${p.filename} (poz: ${p.pose})`).join('\n')

  const measurements = listMeasurements()
  const measInfo = measurements[0] ? measurementSummary(measurements[0]) : 'Kayıtlı ölçüm yok.'

  const { query } = await loadSdk()
  const prompt = `Aşağıdaki poz fotoğraflarını Read aracıyla tek tek oku ve incele (çalışma dizinindeler). HER GÖRSELİN ÜZERİNDE YAZAN TARİHİ oku ve gerçek tarih olarak kullan; fotoğrafları bu tarihlere göre sırala:\n${fileLines}\n\nEn güncel ölçüm:\n${measInfo}\n\nBu görseller ve veriye dayanarak vücut analizi raporunu üret; farklı tarihlerdeki hâllerini (özellikle eski fit hâlini) güncel hâlinle karşılaştır.`

  let result = ''
  for await (const msg of query({
    prompt,
    options: {
      systemPrompt: ANALYSIS_SYSTEM,
      settingSources: [],
      allowedTools: ['Read'],
      cwd: photosDir(),
      maxTurns: 16,
      model: 'claude-opus-4-8'
    }
  })) {
    if ('result' in msg && typeof msg.result === 'string') {
      result = msg.result
    }
  }

  const latestDate = chosen[chosen.length - 1].date
  return insertAnalysis(latestDate, result || 'Analiz üretilemedi.', chosen.length)
}
