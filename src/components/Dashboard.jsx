import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { formatARS, formatARSShort } from '../utils/format'

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      {direction === 'asc'
        ? <polyline points="18 15 12 9 6 15" strokeLinecap="round" strokeLinejoin="round" />
        : <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.dataKey}: {formatARS(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard({ data, onRefresh }) {
  const { months, monthTotals, expenses, currentMonthKey } = data
  const initialIdx = Math.max(0, months.findIndex(m => m.key === currentMonthKey))
  const [idx, setIdx] = useState(initialIdx)
  const [sortBy, setSortBy] = useState('real-desc') // 'real-desc' | 'real-asc' | 'name-asc' | 'name-desc'

  const month = months[idx]
  const totals = monthTotals[month.key]

  const percentage =
    totals?.estimated && totals?.real
      ? Math.round((totals.real / totals.estimated) * 100)
      : null

  // All expenses for selected month
  const monthExpenses = expenses
    .map(e => ({
      name: e.name,
      real: e.monthData[month.key]?.real,
      estimated: e.monthData[month.key]?.estimated,
    }))
    .filter(e => e.real != null || e.estimated != null)

  // Sort
  const sorted = [...monthExpenses].sort((a, b) => {
    if (sortBy === 'real-desc') return (b.real ?? b.estimated ?? 0) - (a.real ?? a.estimated ?? 0)
    if (sortBy === 'real-asc') return (a.real ?? a.estimated ?? 0) - (b.real ?? b.estimated ?? 0)
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es')
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'es')
    return 0
  })

  // Last 6 months chart
  const chartMonths = months.slice(Math.max(0, idx - 5), idx + 1)
  const chartData = chartMonths.map(m => {
    const t = monthTotals[m.key]
    return {
      name: m.label.split(' ')[0].substring(0, 3),
      Estimado: t?.estimated ?? 0,
      Real: t?.real ?? 0,
    }
  })

  const cycleSortAmount = () => {
    setSortBy(s => s === 'real-desc' ? 'real-asc' : 'real-desc')
  }
  const cycleSortName = () => {
    setSortBy(s => s === 'name-asc' ? 'name-desc' : 'name-asc')
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Month Navigator */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="p-2 rounded-full bg-white shadow-sm text-slate-600 disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronLeft />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">{month.label}</h1>
          <p className="text-xs text-slate-400">Gastos del mes</p>
        </div>
        <button
          onClick={() => setIdx(i => Math.min(months.length - 1, i + 1))}
          disabled={idx === months.length - 1}
          className="p-2 rounded-full bg-white shadow-sm text-slate-600 disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-indigo-200 text-sm mb-1">Total Real</p>
        <p className="text-4xl font-bold mb-4">
          {totals?.real != null ? formatARS(totals.real) : '-'}
        </p>
        {totals?.estimated != null && (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-indigo-200">Estimado</span>
              <span className="font-medium">{formatARS(totals.estimated)}</span>
            </div>
            {percentage != null && (
              <div>
                <div className="flex justify-between text-xs text-indigo-200 mb-1">
                  <span>{percentage}% del estimado</span>
                  <span className={percentage > 100 ? 'text-red-300' : 'text-green-300'}>
                    {percentage > 100 ? `+${percentage - 100}%` : `-${100 - percentage}%`}
                  </span>
                </div>
                <div className="h-2 bg-indigo-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${percentage > 100 ? 'bg-red-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header with sort controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Servicios ({sorted.length})
          </span>
          <div className="flex gap-2">
            <button
              onClick={cycleSortName}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                sortBy.startsWith('name') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              A-Z
              {sortBy.startsWith('name') && <SortIcon direction={sortBy === 'name-asc' ? 'asc' : 'desc'} />}
            </button>
            <button
              onClick={cycleSortAmount}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                sortBy.startsWith('real') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              $
              {sortBy.startsWith('real') && <SortIcon direction={sortBy === 'real-asc' ? 'asc' : 'desc'} />}
            </button>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {sorted.map(e => {
            const hasComparison = e.real != null && e.estimated != null && e.estimated !== 0
            const diff = hasComparison ? e.real - e.estimated : null
            const pct = hasComparison ? Math.round((diff / e.estimated) * 100) : null
            const color = !hasComparison
              ? 'text-slate-800'
              : diff > 0 ? 'text-red-500'
              : diff < 0 ? 'text-green-600'
              : 'text-slate-800'

            return (
              <div key={e.name} className="flex items-center px-4 py-3">
                <span className="text-sm text-slate-700 flex-1 truncate pr-3">{e.name}</span>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <p className={`text-sm font-semibold ${color}`}>
                      {e.real != null ? formatARS(e.real) : '-'}
                    </p>
                    {pct !== null && pct !== 0 && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        diff > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                      }`}>
                        {diff > 0 ? '+' : ''}{pct}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {e.estimated != null ? `est. ${formatARS(e.estimated)}` : 'sin estimado'}
                  </p>
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Sin datos para este mes</p>
          )}
        </div>
      </div>

      {/* History Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Últimos meses
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis hide tickFormatter={formatARSShort} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Estimado" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Real" fill="#6366f1" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.Real > entry.Estimado && entry.Estimado > 0 ? '#f43f5e' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-indigo-200" />
            <span className="text-xs text-slate-500">Estimado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span className="text-xs text-slate-500">Real</span>
          </div>
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="w-full py-3 text-sm text-slate-400 hover:text-indigo-600 transition-colors"
      >
        Actualizar datos
      </button>
    </div>
  )
}
