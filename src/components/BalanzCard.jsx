import { formatARS } from '../utils/format'

export default function BalanzCard({ balanz }) {
  if (!balanz) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Guardado en Balanz
        </h2>
      </div>

      <div className="divide-y divide-slate-50">
        {balanz.items.map(({ label, amount }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-600">{label}</span>
            <span className={`text-sm font-semibold ${
              amount == null ? 'text-slate-400'
              : amount < 0 ? 'text-red-500'
              : 'text-emerald-600'
            }`}>
              {amount != null ? formatARS(amount) : '-'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
        <span className="text-sm font-semibold text-slate-700">Total gastado</span>
        <span className="text-sm font-bold text-slate-800">{formatARS(balanz.total)}</span>
      </div>
    </div>
  )
}
