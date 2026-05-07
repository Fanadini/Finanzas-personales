import { useState, useMemo } from 'react'
import { formatARS, getCategory, CATEGORY_COLORS } from '../utils/format'
import LineChart from './LineChart'

export default function TrendView({ data }) {
  const { expenses, months } = data
  const [selectedName, setSelectedName] = useState(expenses[0]?.name ?? '')
  const [showEstimated, setShowEstimated] = useState(true)
  const [showMA, setShowMA] = useState(true)

  const expense = expenses.find(e => e.name === selectedName)
  const category = getCategory(selectedName)
  const color = CATEGORY_COLORS[category]

  const chartData = useMemo(() => {
    if (!expense) return []
    return months
      .map(m => {
        const md = expense.monthData[m.key]
        return {
          name: `${m.label.split(' ')[0].substring(0, 3)} ${String(m.year).slice(2)}`,
          Real: md?.real,
          Estimado: md?.estimated,
        }
      })
      .filter(d => d.Real != null || d.Estimado != null)
  }, [expense, months])

  const maData = useMemo(() => {
    return chartData.map((_, i) => {
      const window = chartData.slice(Math.max(0, i - 2), i + 1)
        .map(d => d.Real).filter(v => v != null)
      return window.length >= 2 ? window.reduce((a, b) => a + b, 0) / window.length : null
    })
  }, [chartData])

  const realValues = chartData.map(d => d.Real).filter(v => v != null)
  const min = realValues.length ? Math.min(...realValues) : 0
  const max = realValues.length ? Math.max(...realValues) : 0
  const avg = realValues.length ? realValues.reduce((a, b) => a + b, 0) / realValues.length : 0

  const lastReal = realValues.at(-1)
  const prevReal = realValues.at(-2)
  const trend = lastReal != null && prevReal != null && prevReal !== 0
    ? Math.round(((lastReal - prevReal) / prevReal) * 100)
    : null

  const byCategory = {}
  expenses.forEach(e => {
    const cat = getCategory(e.name)
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(e.name)
  })

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-olive-800 mb-3">Tendencias</h1>
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          className="w-full p-3 bg-white border border-warm-200 rounded-xl text-olive-700 shadow-sm text-sm appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
        >
          {Object.entries(byCategory).sort().map(([cat, names]) => (
            <optgroup key={cat} label={cat}>
              {names.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-warm-400 mb-1">Último real</p>
          <p className="text-lg font-bold text-olive-800">{formatARS(lastReal)}</p>
          {trend != null && (
            <p className={`text-xs font-medium mt-0.5 ${trend > 0 ? 'text-gold-500' : 'text-olive-500'}`}>
              {trend > 0 ? '+' : ''}{trend}% vs mes ant.
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-warm-400 mb-1">Promedio</p>
          <p className="text-lg font-bold text-olive-600">{formatARS(avg)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-warm-400 mb-1">Mínimo</p>
          <p className="text-base font-bold text-olive-500">{formatARS(min)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-warm-400 mb-1">Máximo</p>
          <p className="text-base font-bold text-gold-500">{formatARS(max)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            onClick={() => setShowEstimated(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showEstimated ? 'bg-olive-400' : 'bg-warm-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showEstimated ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-olive-700">Estimado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            onClick={() => setShowMA(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showMA ? 'bg-gold-400' : 'bg-warm-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showMA ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-olive-700">Media móvil 3m</span>
        </label>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-olive-700">{selectedName}</span>
        </div>
        <LineChart
          data={chartData}
          color={color}
          showEstimated={showEstimated}
          movingAverage={showMA ? maData : null}
        />
        <div className="flex flex-wrap gap-4 justify-center mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-warm-400">Real</span>
          </div>
          {showEstimated && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-gold-100" />
              <span className="text-xs text-warm-400">Estimado</span>
            </div>
          )}
          {showMA && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #B8A46A' }} />
              <span className="text-xs text-warm-400">Media móvil 3m</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-warm-100">
          <h2 className="text-xs font-semibold text-warm-400 uppercase tracking-wider">
            Historial completo
          </h2>
        </div>
        <div className="divide-y divide-warm-50 max-h-80 overflow-y-auto">
          {[...chartData].reverse().map(d => (
            <div key={d.name} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-warm-400">{d.name}</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-olive-800">
                  {d.Real != null ? formatARS(d.Real) : '-'}
                </p>
                {d.Estimado != null && (
                  <p className="text-xs text-warm-400">est. {formatARS(d.Estimado)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
