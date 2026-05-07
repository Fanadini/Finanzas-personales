import { useState } from 'react'
import { useExpenseData } from './hooks/useExpenseData'
import Dashboard from './components/Dashboard'
import MonthView from './components/MonthView'
import TrendView from './components/TrendView'
import NavBar from './components/NavBar'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-olive-100 border-t-olive-500 rounded-full animate-spin" />
      <p className="text-olive-400 text-sm">Cargando datos...</p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-olive-800 mb-1">Error al cargar</h2>
        <p className="text-warm-400 text-sm mb-4">{message}</p>
        <p className="text-xs text-warm-300 mb-6">
          Asegurate de que la planilla esté publicada como CSV en Google Sheets.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="bg-olive-500 text-white px-6 py-3 rounded-xl font-medium text-sm active:scale-95 transition-transform"
      >
        Reintentar
      </button>
    </div>
  )
}

const VIEWS = [Dashboard, MonthView, TrendView]

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const { data, loading, error, refresh } = useExpenseData()

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} onRetry={refresh} />

  const ActiveView = VIEWS[activeTab]

  return (
    <div className="min-h-screen bg-warm-50">
      <ActiveView data={data} onRefresh={refresh} />
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
