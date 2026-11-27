import { useState } from 'react'

// Cada acción es un punto: X = % del día, Y = fuerza. Tamaño = volumen relativo.
export default function XRay({ data, onOpen }) {
  const [sel, setSel] = useState(null)
  const W = 360, H = 300, P = 24
  const xs = data.stocks.map((s) => s.chg)
  const xm = Math.max(1, ...xs.map(Math.abs).sort((a, b) => a - b).slice(0, Math.floor(xs.length * 0.98)))
  const x = (v) => P + ((Math.max(-xm, Math.min(xm, v)) + xm) / (2 * xm)) * (W - 2 * P)
  const y = (v) => P / 2 + ((100 - v) / 200) * (H - P)
  const b = data.breadth
  const lead = data.sectors[0], lag = data.sectors.at(-1)
  const s = sel && data.stocks.find((q) => q.symbol === sel)

  return (
    <div className="mx-4 space-y-3">
      <div className="grid grid-cols-4 gap-2 text-center">
        {[['Alcistas', b.bull, 'text-emerald-600'], ['Bajistas', b.bear, 'text-rose-600'], ['Suben', b.up, 'text-emerald-600'], ['Bajan', b.down, 'text-rose-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-xl py-2 shadow-sm">
            <div className={`text-lg font-bold ${c}`}>{v}</div>
            <div className="text-[10px] text-warm-400">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-warm-400">Sector líder</div>
          <div className="text-sm font-semibold text-emerald-700">{lead?.sector}</div>
          <div className="text-[11px] text-warm-400">Fuerza {lead?.strength} · {lead?.chg}%</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-[10px] text-warm-400">Sector rezagado</div>
          <div className="text-sm font-semibold text-rose-700">{lag?.sector}</div>
          <div className="text-[11px] text-warm-400">Fuerza {lag?.strength} · {lag?.chg}%</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="flex justify-between text-[10px] text-warm-400 mb-1">
          <span>← cae hoy</span><span>Fuerza ↕</span><span>sube hoy →</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <rect x={x(0)} y={0} width={W - P - x(0)} height={y(0)} fill="#10b981" opacity="0.05" />
          <rect x={P} y={y(0)} width={x(0) - P} height={H - P / 2 - y(0)} fill="#f43f5e" opacity="0.05" />
          <line x1={x(0)} x2={x(0)} y1={0} y2={H - P / 2} stroke="#D4C9B8" strokeWidth="0.6" />
          <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} stroke="#D4C9B8" strokeWidth="0.6" />
          {[-xm, -xm / 2, xm / 2, xm].map((t) => (
            <text key={t} x={x(t)} y={H - 2} fontSize="8" fill="#B8A88A" textAnchor="middle">{t > 0 ? '+' : ''}{t.toFixed(1)}%</text>
          ))}
          {data.stocks.map((q) => (
            <circle key={q.symbol} cx={x(q.chg)} cy={y(q.strength)} r={Math.min(6, 1.6 + q.relVol * 1.4)}
              fill={q.bias === 1 ? '#10b981' : q.bias === -1 ? '#f43f5e' : '#B8A88A'}
              opacity={sel === q.symbol ? 1 : 0.55} stroke={sel === q.symbol ? '#1B221D' : 'none'}
              onClick={() => setSel(q.symbol)} />
          ))}
        </svg>
        {s ? (
          <button onClick={() => onOpen(s)} className="w-full mt-2 text-left text-xs bg-warm-50 rounded-xl p-2">
            <b className="text-olive-800">{s.symbol}</b> {s.name} · {s.chg}% · fuerza {s.strength} — <span className="text-olive-500">ver gráfico</span>
          </button>
        ) : <p className="text-[10px] text-warm-300 mt-1">Tocá un punto. Tamaño = volumen relativo.</p>}
      </div>
    </div>
  )
}
