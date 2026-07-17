// Main, preload ve renderer arasında paylaşılan tipler (electron/react bağımlılığı YOK).

export interface Measurement {
  id: number
  date: string // ISO yyyy-mm-dd
  weight_kg: number
  height_cm: number | null
  bmi: number | null
  body_fat_pct: number | null
  fat_mass_kg: number | null
  muscle_mass_kg: number | null
  bmr: number | null
  water_pct: number | null
  trunk_muscle_kg: number | null
  trunk_fat_pct: number | null
  right_leg_muscle_kg: number | null
  right_leg_fat_pct: number | null
  left_leg_muscle_kg: number | null
  left_leg_fat_pct: number | null
  right_arm_muscle_kg: number | null
  right_arm_fat_pct: number | null
  left_arm_muscle_kg: number | null
  left_arm_fat_pct: number | null
  note: string | null
  created_at: string
}

// Yeni ölçüm eklerken kullanıcının verdiği alanlar (id ve created_at hariç).
export type MeasurementInput = Omit<Measurement, 'id' | 'created_at'>

// --- Fotoğraflar ---
export type PhotoPose = 'front' | 'side' | 'back' | 'other'

export interface Photo {
  id: number
  date: string // ISO yyyy-mm-dd
  pose: PhotoPose
  filename: string // userData/photos içindeki dosya adı
  note: string | null
  created_at: string
}

// Fotoğraf eklerken renderer'ın verdiği meta (dosya main tarafında seçilir).
export interface PhotoInput {
  date: string
  pose: PhotoPose
  note: string | null
}

// Renderer'a giden fotoğraf: DB satırı + gösterim için data URL (base64).
export type ClientPhoto = Photo & { dataUrl: string }

// --- Koç sohbeti ---
export interface ChatTurn {
  role: 'user' | 'coach'
  text: string
}

export interface Chat {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  chat_id: number
  role: 'user' | 'coach'
  text: string
  created_at: string
}

// --- Antrenman logu (oturum + hareketler) ---
export interface WorkoutEntry {
  id: number
  session_id: number
  exercise: string
  sets: number
  reps: number
  weight_kg: number
  note: string | null
  created_at: string
}

// Taslakta / eklerken bir hareket (id ve session_id yok).
export type WorkoutEntryInput = Omit<WorkoutEntry, 'id' | 'session_id' | 'created_at'>

export interface WorkoutSession {
  id: number
  date: string // ISO yyyy-mm-dd
  name: string // ör. "Sırt + Biceps günü"
  created_at: string
}

export interface WorkoutSessionInput {
  date: string
  name: string
  entries: WorkoutEntryInput[]
}

export interface WorkoutSessionFull extends WorkoutSession {
  entries: WorkoutEntry[]
}

// --- Antrenman şablonları (hazır hareket listeleri) ---
export interface TemplateEntry {
  id: number
  template_id: number
  exercise: string
  target_sets: number | null
  target_reps: number | null
}

export type TemplateEntryInput = {
  exercise: string
  target_sets: number | null
  target_reps: number | null
}

export interface WorkoutTemplate {
  id: number
  name: string
  created_at: string
}

export interface WorkoutTemplateFull extends WorkoutTemplate {
  entries: TemplateEntry[]
}

export interface TemplateInput {
  name: string
  entries: TemplateEntryInput[]
}

export interface TemplateGenParams {
  goals: string[]
  daysPerWeek: number
  level: string
  note: string | null
}

// --- AI vücut analizi ---
export interface Analysis {
  id: number
  date: string // analiz edilen fotoğrafların tarihi
  report: string
  photo_count: number
  created_at: string
}

// --- AI antrenman programı (yapılandırılmış: günler + hareketler) ---
export interface Program {
  id: number
  title: string
  goals: string // virgülle birleşik hedefler
  days_per_week: number
  content: string // genel açıklama / overview
  created_at: string
}

export interface ProgramDayEntry {
  id: number
  day_id: number
  exercise: string
  target_sets: number | null
  target_reps: number | null
  note: string | null
}

export interface ProgramDay {
  id: number
  program_id: number
  name: string
  entries: ProgramDayEntry[]
}

export interface ProgramFull extends Program {
  days: ProgramDay[]
}

export interface ProgramParams {
  goals: string[]
  daysPerWeek: number
  level: string // Başlangıç | Orta | İleri
  note: string | null
}

// --- AI beslenme programı ---
export interface NutritionPlan {
  id: number
  title: string
  goals: string
  content: string
  created_at: string
}

export interface NutritionParams {
  goals: string[]
  activity: string
  mealsPerDay: number
  note: string | null
}

// --- İlerleme değerlendirmesi ---
export interface ProgressReview {
  id: number
  content: string
  created_at: string
}

// --- Hedefler ---
export interface Goal {
  id: number
  metric: string // ölçüm alanı (weight_kg, body_fat_pct, ...)
  target: number
  deadline: string | null // yyyy-mm-dd
  created_at: string
}

export type GoalInput = {
  metric: string
  target: number
  deadline: string | null
}

// --- Çevre ölçüleri (mezura) ---
export interface BodyMeasure {
  id: number
  date: string
  chest: number | null
  waist: number | null
  hip: number | null
  arm: number | null
  thigh: number | null
  calf: number | null
  neck: number | null
  note: string | null
  created_at: string
}

export type BodyMeasureInput = Omit<BodyMeasure, 'id' | 'created_at'>

// window.api yüzeyi — preload ve renderer aynı tipi kullanır.
export interface SporApi {
  measurements: {
    list: () => Promise<Measurement[]>
    add: (input: MeasurementInput) => Promise<Measurement>
    delete: (id: number) => Promise<void>
    seedBaseline: () => Promise<Measurement[]>
  }
  photos: {
    list: () => Promise<ClientPhoto[]>
    // Dosya seçtirir, kopyalar, kaydeder. İptal edilirse null döner.
    add: (input: PhotoInput) => Promise<ClientPhoto | null>
    delete: (id: number) => Promise<void>
  }
  coach: {
    // Belirli bir sohbete mesaj gönderir; geçmişi ve kullanıcı verisini otomatik ekler.
    ask: (chatId: number, message: string) => Promise<string>
  }
  chats: {
    list: () => Promise<Chat[]>
    create: () => Promise<Chat>
    messages: (chatId: number) => Promise<ChatMessage[]>
    delete: (chatId: number) => Promise<void>
  }
  workouts: {
    listSessions: () => Promise<WorkoutSessionFull[]>
    addSession: (input: WorkoutSessionInput) => Promise<WorkoutSessionFull>
    deleteSession: (id: number) => Promise<void>
  }
  templates: {
    list: () => Promise<WorkoutTemplateFull[]>
    add: (input: TemplateInput) => Promise<WorkoutTemplateFull>
    delete: (id: number) => Promise<void>
    // AI ile hedeflere göre yapılandırılmış şablon(lar) üretir.
    generate: (params: TemplateGenParams) => Promise<WorkoutTemplateFull[]>
    // Var olan bir program metnini şablon(lar)a çevirir.
    fromProgram: (content: string) => Promise<WorkoutTemplateFull[]>
  }
  goals: {
    list: () => Promise<Goal[]>
    add: (input: GoalInput) => Promise<Goal>
    delete: (id: number) => Promise<void>
  }
  bodyMeasures: {
    list: () => Promise<BodyMeasure[]>
    add: (input: BodyMeasureInput) => Promise<BodyMeasure>
    delete: (id: number) => Promise<void>
  }
  backup: {
    // Tüm veriyi seçilen dosyaya yedekler / geri yükler. İptalde false.
    export: () => Promise<boolean>
    import: () => Promise<boolean>
  }
  analysis: {
    // Seçilen fotoğrafları (id listesi, tarihe göre) + ölçümü AI vision ile analiz eder.
    run: (photoIds: number[]) => Promise<Analysis>
    list: () => Promise<Analysis[]>
    delete: (id: number) => Promise<void>
  }
  program: {
    // Hedeflere + kullanıcı verisine göre yapılandırılmış haftalık program üretir.
    generate: (params: ProgramParams) => Promise<ProgramFull>
    list: () => Promise<ProgramFull[]>
    delete: (id: number) => Promise<void>
    setActive: (id: number | null) => Promise<void>
    getActive: () => Promise<ProgramFull | null>
  }
  nutrition: {
    // BMR + ölçüm + hedefe göre günlük beslenme planı (kalori/makro/öğün) üretir.
    generate: (params: NutritionParams) => Promise<NutritionPlan>
    list: () => Promise<NutritionPlan[]>
    delete: (id: number) => Promise<void>
    setActive: (id: number | null) => Promise<void>
    getActive: () => Promise<NutritionPlan | null>
  }
  progress: {
    // Ölçüm geçmişi + antrenman loguna göre AI ilerleme değerlendirmesi üretir.
    review: () => Promise<ProgressReview>
    listReviews: () => Promise<ProgressReview[]>
    deleteReview: (id: number) => Promise<void>
  }
}
