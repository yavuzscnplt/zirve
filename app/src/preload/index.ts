import { contextBridge, ipcRenderer } from 'electron'
import type {
  BodyMeasureInput,
  GoalInput,
  MeasurementInput,
  NutritionParams,
  PhotoInput,
  ProgramParams,
  SporApi,
  TemplateGenParams,
  TemplateInput,
  WorkoutSessionInput
} from '../shared/types'

// Renderer'a yalnız bu dar yüzey açılır; ham ipcRenderer verilmez.
const api: SporApi = {
  measurements: {
    list: () => ipcRenderer.invoke('measurements:list'),
    add: (input: MeasurementInput) => ipcRenderer.invoke('measurements:add', input),
    delete: (id: number) => ipcRenderer.invoke('measurements:delete', id),
    seedBaseline: () => ipcRenderer.invoke('measurements:seedBaseline')
  },
  photos: {
    list: () => ipcRenderer.invoke('photos:list'),
    add: (input: PhotoInput) => ipcRenderer.invoke('photos:add', input),
    delete: (id: number) => ipcRenderer.invoke('photos:delete', id)
  },
  coach: {
    ask: (chatId: number, message: string) => ipcRenderer.invoke('coach:ask', chatId, message)
  },
  chats: {
    list: () => ipcRenderer.invoke('chats:list'),
    create: () => ipcRenderer.invoke('chats:create'),
    messages: (chatId: number) => ipcRenderer.invoke('chats:messages', chatId),
    delete: (chatId: number) => ipcRenderer.invoke('chats:delete', chatId)
  },
  workouts: {
    listSessions: () => ipcRenderer.invoke('workouts:listSessions'),
    addSession: (input: WorkoutSessionInput) => ipcRenderer.invoke('workouts:addSession', input),
    deleteSession: (id: number) => ipcRenderer.invoke('workouts:deleteSession', id)
  },
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    add: (input: TemplateInput) => ipcRenderer.invoke('templates:add', input),
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id),
    generate: (params: TemplateGenParams) => ipcRenderer.invoke('templates:generate', params),
    fromProgram: (content: string) => ipcRenderer.invoke('templates:fromProgram', content)
  },
  analysis: {
    run: (photoIds: number[]) => ipcRenderer.invoke('analysis:run', photoIds),
    list: () => ipcRenderer.invoke('analysis:list'),
    delete: (id: number) => ipcRenderer.invoke('analysis:delete', id)
  },
  program: {
    generate: (params: ProgramParams) => ipcRenderer.invoke('program:generate', params),
    list: () => ipcRenderer.invoke('program:list'),
    delete: (id: number) => ipcRenderer.invoke('program:delete', id),
    setActive: (id: number | null) => ipcRenderer.invoke('program:setActive', id),
    getActive: () => ipcRenderer.invoke('program:getActive')
  },
  nutrition: {
    generate: (params: NutritionParams) => ipcRenderer.invoke('nutrition:generate', params),
    list: () => ipcRenderer.invoke('nutrition:list'),
    delete: (id: number) => ipcRenderer.invoke('nutrition:delete', id),
    setActive: (id: number | null) => ipcRenderer.invoke('nutrition:setActive', id),
    getActive: () => ipcRenderer.invoke('nutrition:getActive')
  },
  progress: {
    review: () => ipcRenderer.invoke('progress:review'),
    listReviews: () => ipcRenderer.invoke('progress:listReviews'),
    deleteReview: (id: number) => ipcRenderer.invoke('progress:deleteReview', id)
  },
  goals: {
    list: () => ipcRenderer.invoke('goals:list'),
    add: (input: GoalInput) => ipcRenderer.invoke('goals:add', input),
    delete: (id: number) => ipcRenderer.invoke('goals:delete', id)
  },
  bodyMeasures: {
    list: () => ipcRenderer.invoke('bodyMeasures:list'),
    add: (input: BodyMeasureInput) => ipcRenderer.invoke('bodyMeasures:add', input),
    delete: (id: number) => ipcRenderer.invoke('bodyMeasures:delete', id)
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: () => ipcRenderer.invoke('backup:import')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (contextIsolation kapalıysa)
  window.api = api
}
