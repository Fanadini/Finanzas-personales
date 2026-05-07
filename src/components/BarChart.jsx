import { formatARS } from '../utils/format'

export default function BarChart({ data }) {
  if (!data?.length) return null

  const globalMax = Math.max(...data.map(d => Math.max(d.Estimado ?? 0, d.Real ?? 0)))
  if (globalMax === 0) return null

  return (
    <div>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((d, i) => {
          const estH = d.Estimado ? Math.round((d.Estimado / globalMax) * 100) : 0
          const realH = d.Real ? Math.round((d.Real / globalMax) * 100) : 0
          const over = d.Real > d.Estimado && d.Estimado > 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end gap-0.5 h-28">
                <div className="flex-1 flex flex-col justify-end">
                  <div
                    className="w-full rounded-t bg-indigo-100"
                    style={{ height: `${estH}%` }}
                    title={`Estimado: ${formatARS(d.Estimado)}`}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t ${over ? 'bg-red-400' : 'bg-indigo-500'}`}
                    style={{ height: `${realH}%` }}
                    title={`Real: ${formatARS(d.Real)}`}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-400 truncate w-full text-center">{d.name}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 justify-center mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-100" />
          <span className="text-xs text-slate-500">Estimado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-500" />
          <span className="text-xs text-slate-500">Real</span>
        </div>
      </div>
    </div>
  )
}
