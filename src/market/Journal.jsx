import { useEffect, useMemo, useState } from 'react'

// Diario de operaciones. Se guarda en este navegador (localStorage); se puede exportar/importar a CSV.
const KEY = 'trading-journal-v1'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const EMPTY = { symbol: '', side: 'long', qty: '', entry: '', exit: '', date: new Date().toISOString().slice(0, 10), setup: 'OB', notes: '' }
const pnl = (t) => (t.exit === '' || t.exit == null ? null : (t.side === 'long' ? 1 : -1) * (t.exit - t.entry) * t.qty)

export default function Journal() {
  const [trades, setTrades] = useState(read)
  const [f, setF] = useState(EMPTY)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(trades)) } catch {} }, [trades])

  const stats = useMemo(() => {
    const closed = trades.filter((t) => pnl(t) != null)
    const wins = closed.filter((t) => pnl(t) > 0)
    const total = closed.reduce((a, t) => a + pnl(t), 0)
    const gw = wins.reduce((a, t) => a + pnl(t), 0), gl = -closed.filter((t) => pnl(t) < 0).reduce((a, t) => a + pnl(t), 0)
    return { n: closed.length, open: trades.length - closed.length, win: closed.length ? (wins.length / closed.length) * 100 : 0, total, pf: gl ? gw / gl : null }
  }, [trades])

  const add = (e) => {
    e.preventDefault()
    if (!f.symbol || !f.qty || !f.entry) return
    setTrades([{ ...f, id: Date.now(), symbol: f.symbol.toUpperCase(), qty: +f.qty, entry: +f.entry, exit: f.exit === '' ? '' : +f.exit }, ...trades])
    setF({ ...EMPTY, date: f.date })
  }
  const close = (id) => {
    const v = prompt('Precio de salida')
    if (v) setTrades(trades.map((t) => (t.id === id ? { ...t, exit: +v } : t)))
  }
  const exportCsv = () => {
    const h = ['date', 'symbol', 'side', 'qty', 'entry', 'exit', 'setup', 'notes']
    const csv = [h.join(','), ...trades.map((t) => h.map((k) => JSON.stringify(t[k] ?? '')).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'diario-trading.csv'
    a.click()
  }
  const inp = 'px-2 py-2 rounded-lg border border-warm-200 text-sm bg-white min-w-0'
  const money = (v) => v.toLocaleString('es', { style: 'currency', currency: 'USD' })

  return (
    <div className="mx-4 pt-2 space-y-3">
      <div className="grid grid-cols-4 gap-2 text-center">
        {[['Cerradas', stats.n], ['Acierto', `${stats.win.toFixed(0)}%`], ['P. factor', stats.pf ? stats.pf.toFixed(2) : '—'], ['P&L', money(stats.total)]].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl py-2 shadow-sm">
            <div className={`text-sm font-bold ${l === 'P&L' ? (stats.total >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-olive-800'}`}>{v}</div>
            <div className="text-[10px] text-warm-400">{l}</div>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="bg-white rounded-2xl p-3 shadow-sm grid grid-cols-3 gap-2">
        <input className={inp} placeholder="Ticker" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} />
        <select className={inp} value={f.side} onChange={(e) => setF({ ...f, side: e.target.value })}><option value="long">Compra</option><option value="short">Venta</option></select>
        <input className={inp} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <input className={inp} placeholder="Cantidad" inputMode="decimal" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
        <input className={inp} placeholder="Entrada" inputMode="decimal" value={f.entry} onChange={(e) => setF({ ...f, entry: e.target.value })} />
        <input className={inp} placeholder="Salida" inputMode="decimal" value={f.exit} onChange={(e) => setF({ ...f, exit: e.target.value })} />
        <select className={inp} value={f.setup} onChange={(e) => setF({ ...f, setup: e.target.value })}>
          {['OB', 'FVG', 'BOS', 'CHoCH', 'Liquidez', 'Otro'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className={`${inp} col-span-2`} placeholder="Notas" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <button className="col-span-3 py-2 rounded-lg bg-olive-500 text-white text-sm font-medium">Agregar operación</button>
      </form>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {trades.length === 0 && <p className="p-4 text-sm text-warm-400">Todavía no hay operaciones.</p>}
        {trades.map((t) => {
          const p = pnl(t)
          return (
            <div key={t.id} className="px-4 py-2.5 border-b border-warm-100 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-olive-800">{t.symbol} <span className="text-[10px] font-normal text-warm-400">{t.side === 'long' ? 'Compra' : 'Venta'} · {t.setup} · {t.date}</span></div>
                <div className="text-[11px] text-warm-400 tabular-nums truncate">{t.qty} @ {t.entry}{t.exit !== '' ? ` → ${t.exit}` : ''}{t.notes ? ` · ${t.notes}` : ''}</div>
              </div>
              {p == null
                ? <button onClick={() => close(t.id)} className="text-[11px] px-2 py-1 rounded bg-gold-100 text-gold-700">Cerrar</button>
                : <span className={`text-sm tabular-nums ${p >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(p)}</span>}
              <button onClick={() => confirm('¿Borrar operación?') && setTrades(trades.filter((x) => x.id !== t.id))} className="text-warm-300 text-lg px-1">×</button>
            </div>
          )
        })}
      </div>
      <button onClick={exportCsv} className="text-xs text-olive-500">Exportar CSV</button>
      <p className="text-[10px] text-warm-300">El diario se guarda solo en este dispositivo.</p>
    </div>
  )
}
