import { useState } from 'react'
import { formatARS, formatARSShort, getCategory, CATEGORY_COLORS } from '../utils/format'
import BarChart from './BarChart'

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

function CategoryBars({ categories }) {
  if (!categories.length) return null
  const max = Math.max(...categories.map(c => c.value))
  const total = categories.reduce((s, c) => s + c.value, 0)
  return (
    <div className="space-y-2.5">
      {categories.map(c => {
        const pct = Math.round((c.value / total) * 100)
        const barW = (c.value / max) * 100
        return (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-xs text-olive-700 truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-warm-400">{pct}%</span>
                <span className="text-xs font-semibold text-olive-800 tabular-nums">{formatARSShort(c.value)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: c.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BulletBar({ real, estimated }) {
  if (real == null || estimated == null || estimated === 0) return null
  const pct = (real / estimated) * 100
  const over = pct > 100
  return (
    <div className="relative mt-1.5 h-1 w-full rounded-full bg-warm-100">
      <div
        className={`absolute inset-y-0 left-0 h-full rounded-full ${over ? 'bg-gold-400' : 'bg-olive-400'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
      <div className="absolute inset-y-[-1px] right-0 w-px bg-warm-300" />
    </div>
  )
}

export default function Dashboard({ data, onRefresh }) {
  const { months, monthTotals, expenses, currentMonthKey } = data
  const initialIdx = Math.max(0, months.findIndex(m => m.key === currentMonthKey))
  const [idx, setIdx] = useState(initialIdx)
  const [sortBy, setSortBy] = useState('real-desc')

  const month = months[idx]
  const totals = monthTotals[month.key]

  const percentage =
    totals?.estimated && totals?.real
      ? Math.round((totals.real / totals.estimated) * 100)
      : null

  const monthExpenses = expenses
    .map(e => ({
      name: e.name,
      real: e.monthData[month.key]?.real,
      estimated: e.monthData[month.key]?.estimated,
    }))
    .filter(e => e.real != null || e.estimated != null)

  const catMap = {}
  monthExpenses.forEach(e => {
    const cat = getCategory(e.name)
    catMap[cat] = (catMap[cat] ?? 0) + (e.real ?? 0)
  })
  const sankeyData = Object.entries(catMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? '#9A9080' }))
    .sort((a, b) => b.value - a.value)

  const sorted = [...monthExpenses].sort((a, b) => {
    if (sortBy === 'real-desc') return (b.real ?? 0) - (a.real ?? 0)
    if (sortBy === 'real-asc') return (a.real ?? 0) - (b.real ?? 0)
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es')
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'es')
    return 0
  })

  const chartMonths = months.slice(Math.max(0, idx - 5), idx + 1)
  const chartData = chartMonths.map(m => {
    const t = monthTotals[m.key]
    return {
      name: m.label.split(' ')[0].substring(0, 3),
      Estimado: t?.estimated ?? null,
      Real: t?.real ?? null,
    }
  })
  const hasChartData = chartData.some(d => d.Real != null || d.Estimado != null)

  const cycleSortAmount = () => setSortBy(s => s === 'real-desc' ? 'real-asc' : 'real-desc')
  const cycleSortName = () => setSortBy(s => s === 'name-asc' ? 'name-desc' : 'name-asc')

  return (
    <div className="p-4 space-y-4 pb-24">

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="p-2 rounded-full bg-white shadow-sm text-olive-500 disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronLeft />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-olive-800">{month.label}</h1>
          <p className="text-xs text-warm-400">Gastos del mes</p>
        </div>
        <button
          onClick={() => setIdx(i => Math.min(months.length - 1, i + 1))}
          disabled={idx === months.length - 1}
          className="p-2 rounded-full bg-white shadow-sm text-olive-500 disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="bg-gradient-to-br from-olive-500 to-olive-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-olive-200 text-sm mb-1">Total Real</p>
        <p className="text-4xl font-bold mb-4">
          {totals?.real != null ? formatARS(totals.real) : '-'}
        </p>
        {totals?.estimated != null && (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-olive-200">Estimado</span>
              <span className="font-medium">{formatARS(totals.estimated)}</span>
            </div>
            {percentage != null && (
              <div>
                <div className="flex justify-between text-xs text-olive-200 mb-1">
                  <span>{percentage}% del estimado</span>
                  <span className={percentage > 100 ? 'text-gold-300' : 'text-green-300'}>
                    {percentage > 100 ? `+${percentage - 100}%` : `-${100 - percentage}%`}
                  </span>
                </div>
                <div className="h-2 bg-olive-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${percentage > 100 ? 'bg-gold-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {sankeyData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">
            Distribución por categoría
          </h2>
          <CategoryBars categories={sankeyData} />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
          <span className="text-xs font-semibold text-warm-400 uppercase tracking-wider">
            Servicios ({sorted.length})
          </span>
          <div className="flex gap-2">
            <button
              onClick={cycleSortName}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                sortBy.startsWith('name') ? 'bg-olive-50 text-olive-600 font-semibold' : 'text-warm-400 hover:text-olive-600'
              }`}
            >
              A-Z
              {sortBy.startsWith('name') && <SortIcon direction={sortBy === 'name-asc' ? 'asc' : 'desc'} />}
            </button>
            <button
              onClick={cycleSortAmount}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                sortBy.startsWith('real') ? 'bg-olive-50 text-olive-600 font-semibold' : 'text-warm-400 hover:text-olive-600'
              }`}
            >
              $
              {sortBy.startsWith('real') && <SortIcon direction={sortBy === 'real-asc' ? 'asc' : 'desc'} />}
            </button>
          </div>
        </div>

        <div className="divide-y divide-warm-50">
          {sorted.map(e => {
            const hasComparison = e.real != null && e.estimated != null && e.estimated !== 0
            const diff = hasComparison ? e.real - e.estimated : null
            const pct = hasComparison ? Math.round((diff / e.estimated) * 100) : null
            const over = diff != null && diff > 0
            const amountColor = !hasComparison
              ? 'text-olive-700'
              : over ? 'text-gold-500' : 'text-olive-600'

            return (
              <div key={e.name} className="flex items-center px-4 py-3">
                <span className="text-sm text-olive-700 flex-1 truncate pr-3">{e.name}</span>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <p className={`text-sm font-semibold ${amountColor}`}>
                      {e.real != null ? formatARS(e.real) : '-'}
                    </p>
                    {pct !== null && pct !== 0 && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        over ? 'bg-gold-50 text-gold-600' : 'bg-olive-50 text-olive-600'
                      }`}>
                        {over ? '+' : ''}{pct}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-400">
                    {e.estimated != null ? `est. ${formatARS(e.estimated)}` : 'sin estimado'}
                  </p>
                  <BulletBar real={e.real} estimated={e.estimated} />
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && (
            <p className="text-sm text-warm-400 text-center py-8">Sin datos para este mes</p>
          )}
        </div>
      </div>

      {hasChartData && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">
            Últimos meses
          </h2>
          <BarChart data={chartData} />
        </div>
      )}

      <button
        onClick={onRefresh}
        className="w-full py-3 text-sm text-warm-400 hover:text-olive-600 transition-colors"
      >
        Actualizar datos
      </button>
    </div>
  )
}
