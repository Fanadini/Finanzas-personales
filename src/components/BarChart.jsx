import { useState } from 'react'

function formatARS(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function BarChart({ data }) {
  const [active, setActive] = useState(null)
  const hasData = data?.some(d => (d.Real ?? 0) > 0 || (d.Estimado ?? 0) > 0)

  if (!data?.length || !hasData) {
    return (
      <div className="h-36 flex items-center justify-center">
        <p className="text-sm text-warm-300">Sin datos</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.Estimado ?? 0, d.Real ?? 0)))
  const BAR_H = 112
  const activeData = active != null ? data[active] : null

  return (
    <div>
      {activeData && (
        <div className="mb-3 px-3 py-2 bg-olive-50 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-olive-700">{activeData.name}</span>
          <div className="flex gap-3">
            {activeData.Estimado != null && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-gold-200 flex-shrink-0" />
                <span className="text-xs text-warm-400">{formatARS(activeData.Estimado)}</span>
              </div>
            )}
            {activeData.Real != null && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${(activeData.Real ?? 0) > (activeData.Estimado ?? 0) && (activeData.Estimado ?? 0) > 0 ? 'bg-gold-400' : 'bg-olive-500'}`} />
                <span className="text-xs font-semibold text-olive-700">{formatARS(activeData.Real)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex items-end gap-1.5 h-36">
        {data.map((d, i) => {
          const estPx = d.Estimado ? Math.round((d.Estimado / maxVal) * BAR_H) : 0
          const realPx = d.Real ? Math.round((d.Real / maxVal) * BAR_H) : 0
          const over = (d.Real ?? 0) > (d.Estimado ?? 0) && (d.Estimado ?? 0) > 0
          const isActive = active === i
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer rounded transition-colors ${isActive ? 'bg-warm-100' : 'hover:bg-warm-50'}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onTouchStart={() => setActive(i)}
              onTouchEnd={() => setActive(null)}
            >
              <div className="w-full flex items-end gap-0.5" style={{ height: BAR_H }}>
                <div className="flex-1 flex flex-col justify-end" style={{ height: BAR_H }}>
                  {estPx > 0 && (
                    <div
                      className="w-full rounded-t bg-gold-100"
                      style={{ height: estPx }}
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end" style={{ height: BAR_H }}>
                  {realPx > 0 && (
                    <div
                      className={`w-full rounded-t ${over ? 'bg-gold-400' : 'bg-olive-500'}`}
                      style={{ height: realPx }}
                    />
                  )}
                </div>
              </div>
              <span className={`text-[9px] truncate w-full text-center transition-colors ${isActive ? 'text-olive-600 font-semibold' : 'text-warm-400'}`}>{d.name}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 justify-center mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gold-100" />
          <span className="text-xs text-warm-400">Estimado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-olive-500" />
          <span className="text-xs text-warm-400">Real</span>
        </div>
      </div>
    </div>
  )
}
