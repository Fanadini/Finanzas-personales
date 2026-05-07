import { useState } from 'react'
import { formatARS } from '../utils/format'

function ChevronDown({ expanded }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BalanzCard({ balanz, expenses, months }) {
  const [expanded, setExpanded] = useState({})

  if (!balanz) return null

  const toggle = label => setExpanded(prev => ({ ...prev, [label]: !prev[label] }))

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Guardado en Balanz
        </h2>
      </div>

      <div className="divide-y divide-slate-50">
        {balanz.items.map(({ label, amount }) => {
          const expense = expenses?.find(e => e.name.toLowerCase() === label.toLowerCase())
          const isExpanded = expanded[label]
          const monthHistory = expense && months
            ? months
                .map(m => ({ label: m.label, real: expense.monthData[m.key]?.real }))
                .filter(d => d.real != null)
                .reverse()
            : []

          return (
            <div key={label}>
              <button
                onClick={() => expense && toggle(label)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${expense ? 'active:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`flex-shrink-0 transition-colors ${expense ? 'text-slate-400' : 'text-transparent'}`}>
                    <ChevronDown expanded={isExpanded} />
                  </span>
                  <span className="text-sm text-slate-600 truncate">{label}</span>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ml-3 ${
                  amount == null ? 'text-slate-400'
                  : amount < 0 ? 'text-red-500'
                  : 'text-slate-700'
                }`}>
                  {amount != null ? formatARS(amount) : '-'}
                </span>
              </button>

              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {monthHistory.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {monthHistory.map(d => (
                        <div key={d.label} className="flex items-center justify-between px-6 py-2">
                          <span className="text-xs text-slate-500">{d.label}</span>
                          <span className="text-xs font-medium text-slate-700">{formatARS(d.real)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-3">Sin datos</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-t border-emerald-100">
        <span className="text-sm font-semibold text-emerald-700">Saldo en Balanz</span>
        <span className="text-lg font-bold text-emerald-700">{formatARS(balanz.total)}</span>
      </div>
    </div>
  )
}
