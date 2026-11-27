import { useMemo, useState } from 'react'

// Gráfico de velas en SVG con order blocks, FVG, estructura, soporte/resistencia y liquidez
export default function CandleChart({ chart, bars = 90 }) {
  const [hover, setHover] = useState(null)
  const W = 360, H = 260, PR = 46, PB = 16
  const view = useMemo(() => {
    const all = chart.candles
    const start = Math.max(0, all.length - bars)
    const cs = all.slice(start)
    const levels = [chart.support, chart.resistance, chart.buySide, chart.sellSide].filter(Boolean)
    let lo = Math.min(...cs.map((c) => c[3])), hi = Math.max(...cs.map((c) => c[2]))
    const span = hi - lo
    for (const l of levels) if (l > lo - span * 0.15 && l < hi + span * 0.15) { lo = Math.min(lo, l); hi = Math.max(hi, l) }
    const pad = (hi - lo) * 0.05
    return { cs, start, lo: lo - pad, hi: hi + pad }
  }, [chart, bars])

  const { cs, start, lo, hi } = view
  const cw = (W - PR) / cs.length
  const x = (i) => (i - start) * cw + cw / 2
  const y = (p) => PB / 2 + (1 - (p - lo) / (hi - lo)) * (H - PB)
  const inView = (p) => p != null && p >= lo && p <= hi
  const last = cs.at(-1)
  const ticks = Array.from({ length: 5 }, (_, k) => lo + ((hi - lo) * (k + 0.5)) / 5)

  const zones = [
    ...chart.obs.map((o) => ({ ...o, kind: 'OB' })),
    ...chart.fvgs.map((g) => ({ ...g, kind: 'FVG' })),
  ].filter((z) => z.i >= start - 60 && z.top >= lo && z.bottom <= hi)

  const lines = [
    { p: chart.resistance, label: 'R', color: '#9A8550', dash: '' },
    { p: chart.support, label: 'S', color: '#9A8550', dash: '' },
    { p: chart.buySide, label: 'BSL', color: '#2563eb', dash: '4 3' },
    { p: chart.sellSide, label: 'SSL', color: '#2563eb', dash: '4 3' },
  ].filter((l) => inView(l.p))

  const h = hover != null ? chart.candles[hover] : null
  const d = h && new Date(h[0] * 1000)

  return (
    <div className="relative">
      <div className="h-5 text-[11px] text-warm-400 tabular-nums">
        {h ? `${d.toLocaleDateString('es')} · A ${h[1]} · Máx ${h[2]} · Mín ${h[3]} · C ${h[4]}` : 'Tocá una vela para ver el detalle'}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none touch-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const i = Math.floor(((e.clientX - r.left) / r.width) * W / cw) + start
          setHover(i >= start && i < chart.candles.length ? i : null)
        }}
        onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={0} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#E5DDD0" strokeWidth="0.5" />
            <text x={W - PR + 3} y={y(t) + 3} fontSize="8" fill="#B8A88A">{t.toFixed(t < 20 ? 2 : 0)}</text>
          </g>
        ))}
        {zones.map((z, k) => {
          const bull = z.dir === 1
          const x0 = x(Math.max(z.i, start)) - cw / 2
          return (
            <g key={k}>
              <rect x={x0} width={W - PR - x0} y={y(z.top)} height={Math.max(1, y(z.bottom) - y(z.top))}
                fill={bull ? '#10b981' : '#f43f5e'} opacity={z.kind === 'OB' ? 0.18 : 0.08}
                stroke={z.kind === 'OB' ? (bull ? '#10b981' : '#f43f5e') : 'none'} strokeWidth="0.5" />
              <text x={x0 + 2} y={y(z.top) + 7} fontSize="7" fill={bull ? '#047857' : '#be123c'}>
                {z.kind}{z.kind === 'OB' ? (bull ? ' alcista' : ' bajista') : ''}
              </text>
            </g>
          )
        })}
        {chart.events.filter((e) => e.i >= start && inView(e.level)).map((e, k) => (
          <g key={k}>
            <line x1={x(Math.max(e.from, start))} x2={x(e.i)} y1={y(e.level)} y2={y(e.level)}
              stroke={e.dir === 1 ? '#047857' : '#be123c'} strokeWidth="0.7" strokeDasharray="2 2" />
            <text x={x(e.i) - 2} y={y(e.level) + (e.dir === 1 ? -2 : 8)} fontSize="7" textAnchor="end"
              fill={e.dir === 1 ? '#047857' : '#be123c'}>{e.type}</text>
          </g>
        ))}
        {['ema20', 'ema50'].map((k, n) => (
          <polyline key={k} fill="none" stroke={n ? '#B8A46A' : '#5F9271'} strokeWidth="0.9" opacity="0.8"
            points={chart[k].slice(start).map((v, i) => `${x(i + start)},${y(v)}`).join(' ')} />
        ))}
        {cs.map((c, k) => {
          const i = k + start, up = c[4] >= c[1]
          const col = up ? '#10b981' : '#f43f5e'
          return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={y(c[2])} y2={y(c[3])} stroke={col} strokeWidth="0.7" />
              <rect x={x(i) - cw * 0.35} width={cw * 0.7} y={y(Math.max(c[1], c[4]))}
                height={Math.max(0.6, Math.abs(y(c[1]) - y(c[4])))} fill={col} />
            </g>
          )
        })}
        {lines.map((l) => (
          <g key={l.label}>
            <line x1={0} x2={W - PR} y1={y(l.p)} y2={y(l.p)} stroke={l.color} strokeWidth="0.8" strokeDasharray={l.dash} />
            <rect x={W - PR} y={y(l.p) - 5} width={PR} height={10} fill={l.color} />
            <text x={W - PR + 2} y={y(l.p) + 3} fontSize="7" fill="#fff">{l.label} {l.p}</text>
          </g>
        ))}
        <line x1={0} x2={W - PR} y1={y(last[4])} y2={y(last[4])} stroke="#3F4F44" strokeWidth="0.5" strokeDasharray="1 2" />
        {hover != null && hover >= start && (
          <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="#3F4F44" strokeWidth="0.4" />
        )}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-warm-400 mt-1">
        <span><i className="inline-block w-2 h-2 bg-emerald-500/40 mr-1" />OB / FVG alcista</span>
        <span><i className="inline-block w-2 h-2 bg-rose-500/40 mr-1" />OB / FVG bajista</span>
        <span className="text-blue-600">BSL/SSL = liquidez</span>
        <span className="text-gold-500">S/R = soporte/resistencia</span>
        <span className="text-olive-400">EMA 20</span><span className="text-gold-400">EMA 50</span>
      </div>
    </div>
  )
}
