import { useEffect, useMemo, useState } from 'react'
import { useScan, loadChart } from './useScan'
import CandleChart from './CandleChart'
import XRay from './XRay'
import Journal from './Journal'

const SECTIONS = ['Alcistas', 'Bajistas', 'Liquidez', 'X-Ray', 'Escáner', 'Diario']
const pct = (v) => `${v > 0 ? '+' : ''}${v?.toFixed(2)}%`
const clr = (v) => (v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-warm-400')
const ibkr = (s) => `https://www.interactivebrokers.com/en/trading/symbol-search.php?symbol=${encodeURIComponent(s)}`

function Score({ v, max = 100 }) {
  const w = Math.min(100, (Math.abs(v) / max) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-warm-100 rounded-full overflow-hidden">
        <div className={`h-full ${v >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${w}%` }} />
      </div>
      <span className={`text-xs tabular-nums w-7 text-right ${clr(v)}`}>{v}</span>
    </div>
  )
}

function Row({ s, rank, onOpen, right }) {
  return (
    <button onClick={() => onOpen(s)} className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-warm-100 text-left active:bg-warm-50">
      {rank != null && <span className="w-5 text-xs text-warm-300 tabular-nums">{rank}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-olive-800 text-sm">{s.symbol}</span>
          {s.inOB && <span className="text-[9px] px-1 rounded bg-gold-100 text-gold-700">en OB</span>}
          {s.lastEvent?.daysAgo <= 3 && (
            <span className={`text-[9px] px-1 rounded ${s.lastEvent.dir === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {s.lastEvent.type}
            </span>
          )}
        </div>
        <div className="text-[11px] text-warm-400 truncate">{s.name} · {s.sector}</div>
      </div>
      <div className="text-right">
        <div className="text-sm tabular-nums text-olive-800">{s.price}</div>
        <div className={`text-[11px] tabular-nums ${clr(s.chg)}`}>{pct(s.chg)}</div>
      </div>
      {right ?? <Score v={s.strength} />}
    </button>
  )
}

function SectorFlow({ sectors }) {
  const max = Math.max(...sectors.map((s) => Math.abs(s.strength)), 1)
  return (
    <div className="bg-white rounded-2xl p-4 mx-4 mb-3 shadow-sm">
      <h3 className="text-xs font-semibold text-olive-600 mb-2">Flujo por sector</h3>
      {sectors.map((s) => (
        <div key={s.sector} className="flex items-center gap-2 py-0.5 text-[11px]">
          <span className="w-28 truncate text-warm-400">{s.sector}</span>
          <div className="flex-1 flex h-2">
            <div className="w-1/2 flex justify-end">{s.strength < 0 && <div className="bg-rose-400 rounded-l" style={{ width: `${(-s.strength / max) * 100}%` }} />}</div>
            <div className="w-1/2">{s.strength > 0 && <div className="h-full bg-emerald-400 rounded-r" style={{ width: `${(s.strength / max) * 100}%` }} />}</div>
          </div>
          <span className={`w-12 text-right tabular-nums ${clr(s.chg)}`}>{pct(s.chg)}</span>
        </div>
      ))}
    </div>
  )
}

function Board({ data, dir, onOpen }) {
  const list = data.stocks.filter((s) => s.bias === dir && !s.choppy)
    .sort((a, b) => dir * (b.strength - a.strength) || b.liqScore - a.liqScore).slice(0, 20)
  return (
    <>
      <SectorFlow sectors={data.sectors} />
      <div className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 text-[11px] text-warm-400 border-b border-warm-100">
          Top 20 {dir === 1 ? 'alcistas' : 'bajistas'} por fuerza (se excluyen las acciones laterales)
        </div>
        {list.map((s, i) => <Row key={s.symbol} s={s} rank={i + 1} onOpen={onOpen} />)}
      </div>
    </>
  )
}

function LiquidityBoard({ data, onOpen }) {
  const [onlyNear, setOnlyNear] = useState(true)
  const list = data.stocks.filter((s) => s.idea && s.liqScore > 0 && s.idea.rr >= 1.5)
    .filter((s) => !onlyNear || Math.abs(s.idea.distPct) <= s.atrPct * 1.5)
    .sort((a, b) => b.liqScore - a.liqScore).slice(0, 30)
  return (
    <div className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-2 flex items-center justify-between border-b border-warm-100">
        <span className="text-[11px] text-warm-400">Ideas: entrada en el OB y objetivo en la liquidez</span>
        <label className="text-[11px] text-olive-600 flex items-center gap-1">
          <input type="checkbox" checked={onlyNear} onChange={(e) => setOnlyNear(e.target.checked)} /> cerca
        </label>
      </div>
      {list.length === 0 && <p className="p-4 text-sm text-warm-400">Sin ideas que cumplan los filtros ahora mismo.</p>}
      {list.map((s) => (
        <button key={s.symbol} onClick={() => onOpen(s)} className="w-full px-4 py-2.5 border-b border-warm-100 text-left">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-olive-800">
              {s.symbol} <span className={`text-[10px] px-1 rounded ${s.idea.side === 'long' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{s.idea.side === 'long' ? 'COMPRA' : 'VENTA'}</span>
            </span>
            <span className="text-[11px] text-warm-400">Liq. {s.liqScore} · R:R {s.idea.rr}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1 text-[11px] tabular-nums">
            <span className="text-warm-400">Precio <b className="text-olive-800">{s.price}</b></span>
            <span className="text-warm-400">Entrada <b className="text-olive-800">{s.idea.entry}</b></span>
            <span className="text-warm-400">Stop <b className="text-rose-600">{s.idea.stop}</b></span>
            <span className="text-warm-400">Obj. <b className="text-emerald-600">{s.idea.target}</b></span>
          </div>
        </button>
      ))}
    </div>
  )
}

const COLS = [
  ['symbol', 'Ticker'], ['chg', '%'], ['strength', 'Fuerza'], ['liqScore', 'Liq.'], ['relVol', 'Vol rel.'], ['rsi', 'RSI'],
]
function Scanner({ data, onOpen }) {
  const [q, setQ] = useState('')
  const [sector, setSector] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState(['strength', -1])
  const list = useMemo(() => {
    let l = data.stocks.filter((s) => (!q || s.symbol.includes(q.toUpperCase()) || s.name.toLowerCase().includes(q.toLowerCase())) && (!sector || s.sector === sector))
    if (filter === 'inOB') l = l.filter((s) => s.inOB)
    if (filter === 'bos') l = l.filter((s) => s.lastEvent?.daysAgo <= 3)
    if (filter === 'vol') l = l.filter((s) => s.relVol >= 1.5)
    const [k, d] = sort
    return [...l].sort((a, b) => (typeof a[k] === 'string' ? a[k].localeCompare(b[k]) : a[k] - b[k]) * d)
  }, [data, q, sector, filter, sort])
  return (
    <div className="mx-4">
      <div className="flex gap-2 mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ticker o nombre"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-warm-200 text-sm bg-white" />
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-32 px-2 py-2 rounded-xl border border-warm-200 text-xs bg-white">
          <option value="">Todos</option>
          {data.sectors.map((s) => <option key={s.sector}>{s.sector}</option>)}
        </select>
      </div>
      <div className="flex gap-1.5 mb-2 overflow-x-auto">
        {[['', 'Todo'], ['inOB', 'Precio en OB'], ['bos', 'BOS/CHoCH reciente'], ['vol', 'Volumen alto']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] ${filter === k ? 'bg-olive-500 text-white' : 'bg-white text-olive-600 border border-warm-200'}`}>{l}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-6 px-3 py-2 text-[10px] text-warm-400 border-b border-warm-100">
          {COLS.map(([k, l]) => (
            <button key={k} onClick={() => setSort([k, sort[0] === k ? -sort[1] : -1])} className="text-left">
              {l}{sort[0] === k ? (sort[1] > 0 ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
        {list.slice(0, 200).map((s) => (
          <button key={s.symbol} onClick={() => onOpen(s)} className="w-full grid grid-cols-6 px-3 py-2 text-xs tabular-nums border-b border-warm-50 text-left">
            <span className="font-semibold text-olive-800">{s.symbol}</span>
            <span className={clr(s.chg)}>{pct(s.chg)}</span>
            <span className={clr(s.strength)}>{s.strength}</span>
            <span className="text-olive-700">{s.liqScore}</span>
            <span className="text-olive-700">{s.relVol}x</span>
            <span className="text-olive-700">{s.rsi}</span>
          </button>
        ))}
        <div className="px-3 py-2 text-[10px] text-warm-300">{list.length} resultados</div>
      </div>
    </div>
  )
}

function Stat({ label, value, cls = 'text-olive-800' }) {
  return (
    <div className="bg-warm-50 rounded-xl px-2.5 py-2">
      <div className="text-[10px] text-warm-400">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${cls}`}>{value ?? '—'}</div>
    </div>
  )
}

function StockDetail({ s, onClose }) {
  const [chart, setChart] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => { loadChart(s.symbol).then(setChart, (e) => setErr(e.message)) }, [s.symbol])
  const ob = s.bias === -1 ? s.bearOB : s.bullOB || s.bearOB
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-h-[92vh] overflow-y-auto rounded-t-3xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-olive-800">{s.symbol} <span className={`text-sm ${clr(s.chg)}`}>{s.price} ({pct(s.chg)})</span></h2>
            <p className="text-xs text-warm-400">{s.name} · {s.sector}</p>
          </div>
          <button onClick={onClose} className="text-warm-400 text-2xl leading-none px-2">×</button>
        </div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        {chart ? <CandleChart chart={chart} /> : !err && <div className="h-64 animate-pulse bg-warm-50 rounded-xl" />}
        <h3 className="text-xs font-semibold text-olive-600 mt-4 mb-2">Zonas</h3>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Resistencia" value={s.resistance} />
          <Stat label="Liquidez arriba (BSL)" value={s.buySide} cls="text-blue-600" />
          <Stat label="Order block" value={ob ? `${ob.bottom} – ${ob.top}` : null} cls={ob === s.bullOB ? 'text-emerald-600' : 'text-rose-600'} />
          <Stat label="Liquidez abajo (SSL)" value={s.sellSide} cls="text-blue-600" />
          <Stat label="Soporte" value={s.support} />
          <Stat label="Estructura" value={s.lastEvent ? `${s.lastEvent.type} ${s.lastEvent.dir === 1 ? '↑' : '↓'} (hace ${s.lastEvent.daysAgo}d)` : null} />
        </div>
        <h3 className="text-xs font-semibold text-olive-600 mt-4 mb-2">Puntuaciones</h3>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Fuerza" value={s.strength} cls={clr(s.strength)} />
          <Stat label="Liquidez" value={s.liqScore} />
          <Stat label="Mov. / ATR" value={s.normMove} cls={clr(s.normMove)} />
          <Stat label="Vol. relativo" value={`${s.relVol}x`} />
          <Stat label="RSI" value={s.rsi} />
          <Stat label="Tendencia limpia" value={s.choppy ? 'Lateral' : `${Math.round(s.eff * 100)}%`} />
        </div>
        {s.idea && (
          <div className={`mt-4 rounded-xl p-3 ${s.idea.side === 'long' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <div className="text-xs font-semibold text-olive-700 mb-1">Idea {s.idea.side === 'long' ? 'de compra' : 'de venta'} · R:R {s.idea.rr}</div>
            <div className="text-xs tabular-nums text-olive-700">Entrada {s.idea.entry} · Stop {s.idea.stop} · Objetivo {s.idea.target} ({s.idea.distPct}% desde el precio)</div>
          </div>
        )}
        <a href={ibkr(s.symbol)} target="_blank" rel="noreferrer" className="block text-center mt-4 py-3 rounded-xl bg-olive-500 text-white text-sm font-medium">
          Ver {s.symbol} en IBKR
        </a>
        <p className="text-[10px] text-warm-300 mt-3">Análisis automático sobre velas diarias. No es una recomendación de inversión.</p>
      </div>
    </div>
  )
}

export default function MarketView() {
  const { data, error, loading, refresh } = useScan()
  const [sec, setSec] = useState(0)
  const [open, setOpen] = useState(null)
  const updated = data && new Date(data.updated)

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-40 bg-warm-50/95 backdrop-blur px-4 pt-5 pb-2" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-olive-800">Mercado</h1>
            {data && (
              <p className="text-[11px] text-warm-400">
                S&P 500 · {data.market === 'open' ? '🟢 abierto' : '⚪ cerrado (última sesión)'} · {updated.toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}
          </div>
          {data && (
            <div className="text-right text-[11px]">
              <span className="text-emerald-600 font-semibold">{data.breadth.bull} ↑</span>{' '}
              <span className="text-rose-600 font-semibold">{data.breadth.bear} ↓</span>
              <button onClick={refresh} className="block ml-auto text-olive-400">actualizar</button>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto -mx-4 px-4">
          {SECTIONS.map((l, i) => (
            <button key={l} onClick={() => setSec(i)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${sec === i ? 'bg-olive-500 text-white' : 'bg-white text-olive-600 border border-warm-200'}`}>{l}</button>
          ))}
        </div>
      </header>

      {sec === 5 ? <Journal /> : loading && !data ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-olive-100 border-t-olive-500 rounded-full animate-spin" /></div>
      ) : error && !data ? (
        <p className="text-center text-sm text-warm-400 py-20 px-6">{error}. El escáner se ejecuta cada 15 minutos en horario de mercado.</p>
      ) : (
        <div className="pt-2">
          {sec === 0 && <Board data={data} dir={1} onOpen={setOpen} />}
          {sec === 1 && <Board data={data} dir={-1} onOpen={setOpen} />}
          {sec === 2 && <LiquidityBoard data={data} onOpen={setOpen} />}
          {sec === 3 && <XRay data={data} onOpen={setOpen} />}
          {sec === 4 && <Scanner data={data} onOpen={setOpen} />}
        </div>
      )}
      {open && <StockDetail s={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
