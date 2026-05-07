import { useState } from 'react'
import { formatARS, getCategory, CATEGORY_COLORS } from '../utils/format'
import Treemap from './Treemap'

function DiffBadge({ real, estimated }) {
  if (real == null || estimated == null || estimated === 0) return null
  const diff = real - estimated
  const pct = Math.round(Math.abs(diff / estimated) * 100)
  if (pct < 1) return null
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
      diff > 0 ? 'bg-gold-50 text-gold-600' : 'bg-olive-50 text-olive-600'
    }`}>
      {diff > 0 ? '+' : '-'}{pct}%
    </span>
  )
}

function CategorySection({ category, items }) {
  const [open, setOpen] = useState(true)
  const totalReal = items.reduce((s, i) => s + (i.real ?? 0), 0)
  const totalEst = items.reduce((s, i) => s + (i.estimated ?? 0), 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-warm-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
          <span className="text-sm font-semibold text-olive-700">{category}</span>
          <span className="text-xs text-warm-400">({items.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-olive-800">{formatARS(totalReal || totalEst)}</span>
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 text-warm-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-warm-100">
          {items.map(item => (
            <div key={item.name} className="flex items-center px-4 py-2.5 border-b border-warm-50 last:border-0">
              <span className="text-sm text-olive-700 flex-1 truncate pr-2">{item.name}</span>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <DiffBadge real={item.real} estimated={item.estimated} />
                <div>
                  <p className={`text-sm font-semibold ${
                    item.estimated != null && item.real != null && item.real > item.estimated
                      ? 'text-gold-500' : 'text-olive-800'
                  }`}>
                    {item.real != null ? formatARS(item.real) : '-'}
                  </p>
                  {item.estimated != null && (
                    <p className="text-xs text-warm-400">est. {formatARS(item.estimated)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {items.length > 1 && (
            <div className="flex justify-between px-4 py-2 bg-warm-50">
              <span className="text-xs font-semibold text-warm-400">Subtotal</span>
              <div className="text-right">
                <span className="text-sm font-bold text-olive-700">{formatARS(totalReal)}</span>
                {totalEst > 0 && (
                  <span className="text-xs text-warm-400 ml-2">/ {formatARS(totalEst)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MonthView({ data }) {
  const { months, expenses, currentMonthKey } = data
  const [selectedKey, setSelectedKey] = useState(currentMonthKey)

  const monthExpenses = expenses
    .map(e => ({
      name: e.name,
      category: getCategory(e.name),
      real: e.monthData[selectedKey]?.real,
      estimated: e.monthData[selectedKey]?.estimated,
    }))
    .filter(e => e.real != null || e.estimated != null)
    .sort((a, b) => (b.real ?? b.estimated ?? 0) - (a.real ?? a.estimated ?? 0))

  const grouped = {}
  monthExpenses.forEach(e => {
    if (!grouped[e.category]) grouped[e.category] = []
    grouped[e.category].push(e)
  })

  const totalReal = monthExpenses.reduce((s, e) => s + (e.real ?? 0), 0)
  const totalEst = monthExpenses.reduce((s, e) => s + (e.estimated ?? 0), 0)

  const sortedCategories = Object.entries(grouped).sort((a, b) => {
    const sumA = a[1].reduce((s, i) => s + (i.real ?? 0), 0)
    const sumB = b[1].reduce((s, i) => s + (i.real ?? 0), 0)
    return sumB - sumA
  })

  const treemapData = Object.entries(grouped)
    .map(([cat, items]) => ({
      name: cat,
      value: items.reduce((s, i) => s + (i.real ?? 0), 0),
      color: CATEGORY_COLORS[cat] ?? '#9A9080',
    }))
    .filter(d => d.value > 0)

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-olive-800 mb-3">Por Mes</h1>
        <select
          value={selectedKey}
          onChange={e => setSelectedKey(e.target.value)}
          className="w-full p-3 bg-white border border-warm-200 rounded-xl text-olive-700 shadow-sm text-sm appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8A88A' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
        >
          {[...months].reverse().map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-warm-400 mb-1">Real</p>
          <p className="text-lg font-bold text-olive-800">{formatARS(totalReal)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-warm-400 mb-1">Estimado</p>
          <p className="text-lg font-bold text-olive-800">{formatARS(totalEst)}</p>
          {totalEst > 0 && totalReal > 0 && (
            <p className={`text-xs mt-0.5 font-medium ${totalReal > totalEst ? 'text-gold-500' : 'text-olive-500'}`}>
              {totalReal > totalEst ? '+' : '-'}{Math.abs(Math.round((totalReal / totalEst - 1) * 100))}%
            </p>
          )}
        </div>
      </div>

      {treemapData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">
            Por categoría
          </h2>
          <Treemap data={treemapData} height={190} />
        </div>
      )}

      {sortedCategories.length > 0 ? (
        sortedCategories.map(([category, items]) => (
          <CategorySection key={category} category={category} items={items} />
        ))
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-warm-400 text-sm">Sin datos para este mes</p>
        </div>
      )}
    </div>
  )
}
