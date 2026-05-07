import { formatARS } from '../utils/format'

export default function LineChart({ data, color, showEstimated }) {
  if (!data?.length) return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Sin datos</p>
    </div>
  )

  const W = 320
  const H = 160
  const PAD = { top: 10, right: 10, bottom: 24, left: 10 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const realVals = data.map(d => d.Real).filter(v => v != null)
  const estVals = data.map(d => d.Estimado).filter(v => v != null)
  const allVals = [...realVals, ...estVals]
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

  const labelIdxs = data.length <= 6
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD.top + t * innerH
        return (
          <line key={t} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
            stroke="#f1f5f9" strokeWidth="1" />
        )
      })}

      {showEstimated && pointsEst.length > 1 && (
        <polyline points={pointsEst.join(' ')} fill="none"
          stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="5 4" />
      )}

      {pointsReal.length > 1 && (
        <polyline points={pointsReal.join(' ')} fill="none"
          stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {data.map((d, i) => d.Real != null && (
        <circle key={i} cx={toX(i)} cy={toY(d.Real)} r="3"
          fill={color} />
      ))}

      {labelIdxs.map(i => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle"
          fontSize="9" fill="#94a3b8">
          {data[i]?.name}
        </text>
      ))}
    </svg>
  )
}
