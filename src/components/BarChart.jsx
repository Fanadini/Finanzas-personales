export default function BarChart({ data }) {
  const hasData = data?.some(d => (d.Real ?? 0) > 0 || (d.Estimado ?? 0) > 0)

  if (!data?.length || !hasData) {
    return (
      <div className="h-36 flex items-center justify-center">
        <p className="text-sm text-warm-300">Sin datos</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.Estimado ?? 0, d.Real ?? 0)))

  return (
    <div>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((d, i) => {
          const estH = d.Estimado ? Math.round((d.Estimado / maxVal) * 100) : 0
          const realH = d.Real ? Math.round((d.Real / maxVal) * 100) : 0
          const over = (d.Real ?? 0) > (d.Estimado ?? 0) && (d.Estimado ?? 0) > 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end gap-0.5 h-28">
                <div className="flex-1 flex flex-col justify-end">
                  {estH > 0 && (
                    <div
                      className="w-full rounded-t bg-gold-100"
                      style={{ height: `${estH}%` }}
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  {realH > 0 && (
                    <div
                      className={`w-full rounded-t ${over ? 'bg-gold-400' : 'bg-olive-500'}`}
                      style={{ height: `${realH}%` }}
                    />
                  )}
                </div>
              </div>
              <span className="text-[9px] text-warm-400 truncate w-full text-center">{d.name}</span>
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
