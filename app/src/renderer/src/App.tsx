import { useState, type ReactElement } from 'react'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { CoachPage } from './features/coach/CoachPage'
import { MeasurementsPage } from './features/measurements/MeasurementsPage'
import { WorkoutsPage } from './features/workouts/WorkoutsPage'
import { ProgramPage } from './features/program/ProgramPage'
import { NutritionPage } from './features/nutrition/NutritionPage'
import { ProgressPage } from './features/progress/ProgressPage'
import { ChartsPage } from './features/charts/ChartsPage'
import { PhotosPage } from './features/photos/PhotosPage'
import { AnalysisPage } from './features/analysis/AnalysisPage'

type Tab =
  | 'dashboard'
  | 'coach'
  | 'measurements'
  | 'workouts'
  | 'program'
  | 'nutrition'
  | 'progress'
  | 'charts'
  | 'photos'
  | 'analysis'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: '🏠 Ana Sayfa' },
  { id: 'coach', label: '🤖 Koç' },
  { id: 'measurements', label: 'Ölçümler' },
  { id: 'workouts', label: 'Antrenman' },
  { id: 'program', label: '📋 Program' },
  { id: 'nutrition', label: '🥗 Beslenme' },
  { id: 'progress', label: '📈 İlerleme' },
  { id: 'charts', label: 'Grafikler' },
  { id: 'photos', label: 'Fotoğraflar' },
  { id: 'analysis', label: '🔬 Analiz' }
]

function App(): ReactElement {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="app">
      <header className="app__header">
        <h1>🏔️ Zirve</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app__body app__body--wide">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'coach' && <CoachPage />}
        {tab === 'measurements' && <MeasurementsPage />}
        {tab === 'workouts' && <WorkoutsPage />}
        {tab === 'program' && <ProgramPage />}
        {tab === 'nutrition' && <NutritionPage />}
        {tab === 'progress' && <ProgressPage />}
        {tab === 'charts' && <ChartsPage />}
        {tab === 'photos' && <PhotosPage />}
        {tab === 'analysis' && <AnalysisPage />}
      </main>
    </div>
  )
}

export default App
