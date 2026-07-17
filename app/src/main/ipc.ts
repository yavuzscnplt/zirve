import { ipcMain } from 'electron'
import {
  addMeasurement,
  deleteMeasurement,
  listMeasurements,
  seedBaseline
} from './db/measurements'
import { addPhoto, removePhoto, listClientPhotos } from './photoService'
import { createChat, deleteChat, listChats, listMessages } from './db/chats'
import { addSession, deleteSession, listSessions } from './db/workouts'
import { addTemplate, deleteTemplate, listTemplates } from './db/templates'
import { generateTemplates, templatesFromText } from './templateService'
import { listAnalyses, deleteAnalysis } from './db/analyses'
import { listProgramsFull, deleteProgram, getProgramFull } from './db/programs'
import { listPlans, deletePlan, getPlan } from './db/nutrition'
import { listReviews, deleteReview } from './db/progress'
import { addGoal, deleteGoal, listGoals } from './db/goals'
import { addBodyMeasure, deleteBodyMeasure, listBodyMeasures } from './db/bodyMeasures'
import { getSetting, setSetting } from './db/settings'
import { askCoach } from './coachService'
import { runAnalysis } from './analysisService'
import { generateProgram } from './programService'
import { generatePlan } from './nutritionService'
import { generateReview } from './progressService'
import { exportBackup, importBackup } from './backupService'
import type {
  BodyMeasureInput,
  GoalInput,
  MeasurementInput,
  NutritionParams,
  PhotoInput,
  ProgramParams,
  TemplateGenParams,
  TemplateInput,
  WorkoutSessionInput
} from '../shared/types'

// Renderer -> main IPC kayıtları. Kanal adı: <alan>:<eylem>.
export function registerIpc(): void {
  // Ölçümler
  ipcMain.handle('measurements:list', () => listMeasurements())
  ipcMain.handle('measurements:add', (_e, input: MeasurementInput) => addMeasurement(input))
  ipcMain.handle('measurements:delete', (_e, id: number) => deleteMeasurement(id))
  ipcMain.handle('measurements:seedBaseline', () => {
    seedBaseline()
    return listMeasurements()
  })

  // Fotoğraflar
  ipcMain.handle('photos:list', () => listClientPhotos())
  ipcMain.handle('photos:add', (_e, input: PhotoInput) => addPhoto(input))
  ipcMain.handle('photos:delete', (_e, id: number) => removePhoto(id))

  // Koç sohbeti
  ipcMain.handle('coach:ask', (_e, chatId: number, message: string) => askCoach(chatId, message))
  ipcMain.handle('chats:list', () => listChats())
  ipcMain.handle('chats:create', () => createChat())
  ipcMain.handle('chats:messages', (_e, chatId: number) => listMessages(chatId))
  ipcMain.handle('chats:delete', (_e, chatId: number) => deleteChat(chatId))

  // Antrenman logu (oturum bazlı)
  ipcMain.handle('workouts:listSessions', () => listSessions())
  ipcMain.handle('workouts:addSession', (_e, input: WorkoutSessionInput) => addSession(input))
  ipcMain.handle('workouts:deleteSession', (_e, id: number) => deleteSession(id))

  // Antrenman şablonları
  ipcMain.handle('templates:list', () => listTemplates())
  ipcMain.handle('templates:add', (_e, input: TemplateInput) => addTemplate(input))
  ipcMain.handle('templates:delete', (_e, id: number) => deleteTemplate(id))
  ipcMain.handle('templates:generate', (_e, params: TemplateGenParams) => generateTemplates(params))
  ipcMain.handle('templates:fromProgram', (_e, content: string) => templatesFromText(content))

  // AI vücut analizi
  ipcMain.handle('analysis:run', (_e, photoIds: number[]) => runAnalysis(photoIds))
  ipcMain.handle('analysis:list', () => listAnalyses())
  ipcMain.handle('analysis:delete', (_e, id: number) => deleteAnalysis(id))

  // AI antrenman programı
  ipcMain.handle('program:generate', (_e, params: ProgramParams) => generateProgram(params))
  ipcMain.handle('program:list', () => listProgramsFull())
  ipcMain.handle('program:delete', (_e, id: number) => deleteProgram(id))
  ipcMain.handle('program:setActive', (_e, id: number | null) =>
    setSetting('active_program', id == null ? null : String(id))
  )
  ipcMain.handle('program:getActive', () => {
    const s = getSetting('active_program')
    return s ? getProgramFull(Number(s)) : null
  })

  // AI beslenme programı
  ipcMain.handle('nutrition:generate', (_e, params: NutritionParams) => generatePlan(params))
  ipcMain.handle('nutrition:list', () => listPlans())
  ipcMain.handle('nutrition:delete', (_e, id: number) => deletePlan(id))
  ipcMain.handle('nutrition:setActive', (_e, id: number | null) =>
    setSetting('active_nutrition', id == null ? null : String(id))
  )
  ipcMain.handle('nutrition:getActive', () => {
    const s = getSetting('active_nutrition')
    return s ? getPlan(Number(s)) : null
  })

  // İlerleme değerlendirmesi
  ipcMain.handle('progress:review', () => generateReview())
  ipcMain.handle('progress:listReviews', () => listReviews())
  ipcMain.handle('progress:deleteReview', (_e, id: number) => deleteReview(id))

  // Hedefler
  ipcMain.handle('goals:list', () => listGoals())
  ipcMain.handle('goals:add', (_e, input: GoalInput) => addGoal(input))
  ipcMain.handle('goals:delete', (_e, id: number) => deleteGoal(id))

  // Çevre ölçüleri (mezura)
  ipcMain.handle('bodyMeasures:list', () => listBodyMeasures())
  ipcMain.handle('bodyMeasures:add', (_e, input: BodyMeasureInput) => addBodyMeasure(input))
  ipcMain.handle('bodyMeasures:delete', (_e, id: number) => deleteBodyMeasure(id))

  // Yedekleme
  ipcMain.handle('backup:export', () => exportBackup())
  ipcMain.handle('backup:import', () => importBackup())
}
