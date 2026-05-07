export default function LineChart({ data, color, showEstimated, movingAverage }) {
  if (!data?.length) return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-warm-300 text-sm">Sin datos</p>
    </div>
  )

  const W = 320
  const H = 160
  const PAD = { top: 10, right: 10, bottom: 24, left: 10 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const realVals = data.map(d => d.Real).filter(v => v != null)
  const estVals = data.map(d => d.Estimado).filter(v => v != null)
  const maVals = (movingAverage ?? []).filter(v => v != null)
  const allVals = [...realVals, ...estVals, ...maVals]
  if (!allVals.length) return null

  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1

  const xStep = innerW / Math.max(data.length - 1, 1)
  const toX = i => PAD.left + i * xStep
  const toY = v => PAD.top + innerH - ((v - minV) / range) * innerH

  const pointsReal = data
    .map((d, i) => d.Real != null ? `${toX(i)},${toY(d.Real)}` : null)
    .filter(Boolean)

  const pointsEst = data
    .map((d, i) => d.Estimado != null ? `${toX(i)},${toY(d.Estimado)}` : null)
    .filter(Boolean)

  const pointsMA = (movingAverage ?? [])
    .map((v, i) => v != null ? `${toX(i)},${toY(v)}` : null)
    .filter(Boolean)

  const labelIdxs = data.length <= 6
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t}
          x1={PAD.left} y1={PAD.top + t * innerH}
          x2={W - PAD.right} y2={PAD.top + t * innerH}
          stroke="#F2EDE4" strokeWidth="1"
        />
      ))}

      {showEstimated && pointsEst.length > 1 && (
        <polyline points={pointsEst.join(' ')} fill="none"
          stroke="#E5D5A0" strokeWidth="1.5" strokeDasharray="5 4" />
      )}

      {pointsReal.length > 1 && (
        <polyline points={pointsReal.join(' ')} fill="none"
          stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {pointsMA.length > 1 && (
        <polyline points={pointsMA.join(' ')} fill="none"
          stroke="#B8A46A" strokeWidth="1.5" strokeDasharray="6 3" strokeLinecap="round" />
      )}

      {data.map((d, i) => d.Real != null && (
        <circle key={i} cx={toX(i)} cy={toY(d.Real)} r="3" fill={color} />
      ))}

      {labelIdxs.map(i => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9A9080">
          {data[i]?.name}
        </text>
      ))}
    </svg>
  )
}
