// Escáner de order blocks / liquidez para el S&P 500.
// Uso: node scripts/scan.mjs [outDir]   (por defecto: public/data)
// Fuente: Yahoo Finance (velas diarias, 1 año). Sin dependencias.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = process.argv[2] || 'public/data'
const LIMIT = Number(process.env.SCAN_LIMIT || 0) // para pruebas
const UA = { 'User-Agent': 'Mozilla/5.0 (scanner)' }
const CONSTITUENTS = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv'

const SECTOR_ES = {
  'Information Technology': 'Tecnología', 'Health Care': 'Salud', Financials: 'Financiero',
  'Consumer Discretionary': 'Consumo discrecional', 'Communication Services': 'Comunicaciones',
  Industrials: 'Industrial', 'Consumer Staples': 'Consumo básico', Energy: 'Energía',
  Utilities: 'Servicios públicos', 'Real Estate': 'Inmobiliario', Materials: 'Materiales',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const round = (x, d = 2) => (x == null || !isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d)

async function fetchJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA })
      if (r.ok) return await r.json()
      if (r.status === 404) return null
    } catch {}
    await sleep(800 * (i + 1))
  }
  return null
}

async function loadUniverse() {
  const txt = await (await fetch(CONSTITUENTS)).text()
  const rows = []
  for (const line of txt.trim().split('\n').slice(1)) {
    const cols = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, ''))
    rows.push({ symbol: cols[0], name: cols[1], sector: SECTOR_ES[cols[2]] || cols[2] })
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows
}

async function fetchCandles(symbol) {
  const y = symbol.replace('.', '-')
  const j = await fetchJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${y}?interval=1d&range=1y`)
  const res = j?.chart?.result?.[0]
  if (!res?.timestamp) return null
  const q = res.indicators.quote[0]
  const c = []
  res.timestamp.forEach((t, i) => {
    if (q.open[i] == null || q.close[i] == null) return
    c.push({ t, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] || 0 })
  })
  return { candles: c, meta: res.meta }
}

// ---------- indicadores ----------
function ema(vals, n) {
  const k = 2 / (n + 1), out = []
  vals.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)))
  return out
}
function atr(c, n = 14) {
  const tr = c.map((b, i) => (i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - c[i - 1].c), Math.abs(b.l - c[i - 1].c))))
  const out = []
  tr.forEach((v, i) => out.push(i < n ? tr.slice(0, i + 1).reduce((a, b) => a + b) / (i + 1) : (out[i - 1] * (n - 1) + v) / n))
  return out
}
function rsi(c, n = 14) {
  let g = 0, l = 0
  for (let i = 1; i <= n; i++) { const d = c[i].c - c[i - 1].c; d > 0 ? (g += d) : (l -= d) }
  g /= n; l /= n
  for (let i = n + 1; i < c.length; i++) {
    const d = c[i].c - c[i - 1].c
    g = (g * (n - 1) + Math.max(d, 0)) / n
    l = (l * (n - 1) + Math.max(-d, 0)) / n
  }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l)
}
// Eficiencia de Kaufman: 1 = tendencia limpia, ~0 = lateral/choppy
function efficiency(c, n = 10) {
  const s = c.slice(-n - 1)
  const net = Math.abs(s.at(-1).c - s[0].c)
  let path = 0
  for (let i = 1; i < s.length; i++) path += Math.abs(s[i].c - s[i - 1].c)
  return path ? net / path : 0
}

// ---------- estructura de mercado (SMC) ----------
function pivots(c, k = 3) {
  const highs = [], lows = []
  for (let i = k; i < c.length - k; i++) {
    let isH = true, isL = true
    for (let j = i - k; j <= i + k; j++) {
      if (j === i) continue
      if (c[j].h >= c[i].h) isH = false
      if (c[j].l <= c[i].l) isL = false
    }
    if (isH) highs.push({ i, p: c[i].h })
    if (isL) lows.push({ i, p: c[i].l })
  }
  return { highs, lows }
}

function structure(c, piv) {
  // Recorre las velas y detecta rupturas de swing (BOS / CHoCH)
  const events = []
  let trend = 0, lastH = null, lastL = null
  let hi = 0, li = 0
  for (let i = 0; i < c.length; i++) {
    while (hi < piv.highs.length && piv.highs[hi].i + 3 <= i) lastH = { ...piv.highs[hi++], broken: false }
    while (li < piv.lows.length && piv.lows[li].i + 3 <= i) lastL = { ...piv.lows[li++], broken: false }
    if (lastH && !lastH.broken && c[i].c > lastH.p) {
      lastH.broken = true
      events.push({ i, type: trend === -1 ? 'CHoCH' : 'BOS', dir: 1, level: lastH.p, from: lastH.i })
      trend = 1
    }
    if (lastL && !lastL.broken && c[i].c < lastL.p) {
      lastL.broken = true
      events.push({ i, type: trend === 1 ? 'CHoCH' : 'BOS', dir: -1, level: lastL.p, from: lastL.i })
      trend = -1
    }
  }
  return { trend, events }
}

function orderBlocks(c, events, A) {
  // OB alcista: última vela bajista antes del impulso que rompió estructura al alza (y viceversa)
  const obs = []
  for (const ev of events) {
    let j = ev.i
    while (j > ev.from - 1 && j > 0) {
      const b = c[j]
      if (ev.dir === 1 ? b.c < b.o : b.c > b.o) break
      j--
    }
    if (j <= 0) continue
    const b = c[j]
    const impulse = Math.abs(c[ev.i].c - b.c) / (A[ev.i] || 1)
    if (impulse < 1) continue
    const ob = { i: j, t: b.t, dir: ev.dir, top: b.h, bottom: b.l, impulse: round(impulse, 1), mitigated: false, tested: false }
    for (let k = ev.i + 1; k < c.length; k++) {
      if (ev.dir === 1) {
        if (c[k].l <= ob.top) ob.tested = true
        if (c[k].c < ob.bottom) { ob.mitigated = true; break }
      } else {
        if (c[k].h >= ob.bottom) ob.tested = true
        if (c[k].c > ob.top) { ob.mitigated = true; break }
      }
    }
    if (!obs.some((o) => o.i === ob.i)) obs.push(ob)
  }
  return obs.filter((o) => !o.mitigated)
}

function fvgs(c) {
  const out = []
  for (let i = 2; i < c.length; i++) {
    if (c[i].l > c[i - 2].h) out.push({ i: i - 1, t: c[i - 1].t, dir: 1, top: c[i].l, bottom: c[i - 2].h })
    if (c[i].h < c[i - 2].l) out.push({ i: i - 1, t: c[i - 1].t, dir: -1, top: c[i - 2].l, bottom: c[i].h })
  }
  // solo los que no se han rellenado
  return out.filter((g) => {
    for (let k = g.i + 2; k < c.length; k++) {
      if (g.dir === 1 && c[k].l <= g.bottom) return false
      if (g.dir === -1 && c[k].h >= g.top) return false
    }
    return true
  })
}

function liquidity(c, piv, A, price) {
  // Liquidez = grupos de máximos/mínimos iguales (stops acumulados) o swings extremos aún no barridos
  const tol = A.at(-1) * 0.25
  const pick = (pts, above) => {
    const cand = pts.filter((p) => (above ? p.p > price : p.p < price))
      .filter((p) => !c.slice(p.i + 1).some((b) => (above ? b.h > p.p : b.l < p.p)))
    const clusters = cand.map((p) => ({ p: p.p, n: cand.filter((q) => Math.abs(q.p - p.p) <= tol).length }))
    clusters.sort((a, b) => b.n - a.n || Math.abs(a.p - price) - Math.abs(b.p - price))
    return clusters[0] ? { level: clusters[0].p, touches: clusters[0].n } : null
  }
  return { buySide: pick(piv.highs, true), sellSide: pick(piv.lows, false) }
}

function analyze(sym, data) {
  const c = data.candles
  if (c.length < 80) return null
  const A = atr(c), closes = c.map((b) => b.c)
  const e20 = ema(closes, 20), e50 = ema(closes, 50), e200 = ema(closes, 200)
  const last = c.at(-1), prev = c.at(-2)
  const price = data.meta.regularMarketPrice ?? last.c
  const prevClose = prev.c
  const chg = ((price - prevClose) / prevClose) * 100
  const atrPct = (A.at(-1) / price) * 100
  const normMove = chg / atrPct // movimiento relativo a la volatilidad propia
  const avgVol = c.slice(-21, -1).reduce((a, b) => a + b.v, 0) / 20
  const relVol = avgVol ? last.v / avgVol : 1
  const r = rsi(c)
  const eff = efficiency(c)
  const piv = pivots(c)
  const st = structure(c, piv)
  const obs = orderBlocks(c, st.events, A)
  const gaps = fvgs(c).slice(-6)
  const liq = liquidity(c, piv, A, price)
  const res = piv.highs.filter((p) => p.p > price).sort((a, b) => a.p - b.p)[0]?.p ?? null
  const sup = piv.lows.filter((p) => p.p < price).sort((a, b) => b.p - a.p)[0]?.p ?? null
  const bullOB = obs.filter((o) => o.dir === 1 && o.bottom < price).sort((a, b) => b.top - a.top)[0] || null
  const bearOB = obs.filter((o) => o.dir === -1 && o.top > price).sort((a, b) => a.bottom - b.bottom)[0] || null
  const ret20 = ((price - c.at(-21).c) / c.at(-21).c) * 100

  // Puntuación de fuerza (-100..100): tendencia + estructura + momentum + movimiento normalizado
  let s = 0
  s += price > e20.at(-1) ? 12 : -12
  s += e20.at(-1) > e50.at(-1) ? 12 : -12
  s += price > e200.at(-1) ? 8 : -8
  s += st.trend * 20
  s += Math.max(-20, Math.min(20, normMove * 10))
  s += Math.max(-15, Math.min(15, (r - 50) * 0.6))
  s += Math.max(-13, Math.min(13, ret20 * 0.8))
  const strength = Math.round(Math.max(-100, Math.min(100, s)))

  // Puntuación de liquidez (0..100): fuerza × participación (volumen) × limpieza de tendencia
  const choppy = eff < 0.25
  const volFactor = Math.min(2, Math.max(0.5, relVol))
  const liqScore = choppy ? 0 : Math.round(Math.min(100, Math.abs(strength) * (0.6 + 0.4 * volFactor) * (0.5 + eff)))
  const bias = strength >= 20 ? 1 : strength <= -20 ? -1 : 0

  // Idea de operación basada en OB + liquidez
  let idea = null
  if (bias === 1 && bullOB) {
    const entry = Math.min(price, bullOB.top), stop = bullOB.bottom - A.at(-1) * 0.2
    const target = liq.buySide?.level ?? res
    if (target && target > entry) idea = { side: 'long', entry, stop, target, rr: (target - entry) / (entry - stop) }
  } else if (bias === -1 && bearOB) {
    const entry = Math.max(price, bearOB.bottom), stop = bearOB.top + A.at(-1) * 0.2
    const target = liq.sellSide?.level ?? sup
    if (target && target < entry) idea = { side: 'short', entry, stop, target, rr: (entry - target) / (stop - entry) }
  }
  if (idea) {
    idea.distPct = ((idea.entry - price) / price) * 100
    for (const k of ['entry', 'stop', 'target', 'rr', 'distPct']) idea[k] = round(idea[k])
  }

  const lastEv = st.events.at(-1)
  const off = c.length - 150
  const shift = (o) => ({ ...o, i: o.i - off })
  return {
    summary: {
      symbol: sym.symbol, name: sym.name, sector: sym.sector,
      price: round(price), chg: round(chg), normMove: round(normMove), atrPct: round(atrPct),
      relVol: round(relVol), rsi: round(r, 0), eff: round(eff), choppy,
      trend: st.trend, lastEvent: lastEv ? { type: lastEv.type, dir: lastEv.dir, daysAgo: c.length - 1 - lastEv.i } : null,
      strength, liqScore, bias, ret20: round(ret20),
      support: round(sup), resistance: round(res),
      bullOB: bullOB && { top: round(bullOB.top), bottom: round(bullOB.bottom), tested: bullOB.tested },
      bearOB: bearOB && { top: round(bearOB.top), bottom: round(bearOB.bottom), tested: bearOB.tested },
      buySide: liq.buySide && round(liq.buySide.level), sellSide: liq.sellSide && round(liq.sellSide.level),
      inOB: !!(bullOB && price <= bullOB.top && price >= bullOB.bottom) || !!(bearOB && price >= bearOB.bottom && price <= bearOB.top),
      idea,
    },
    chart: {
      candles: c.slice(-150).map((b) => [b.t, round(b.o), round(b.h), round(b.l), round(b.c), b.v]),
      ema20: e20.slice(-150).map((v) => round(v)), ema50: e50.slice(-150).map((v) => round(v)),
      obs: obs.filter((o) => o.i >= off).map(shift).map((o) => ({ ...o, top: round(o.top), bottom: round(o.bottom) })),
      fvgs: gaps.filter((g) => g.i >= off).map(shift).map((g) => ({ ...g, top: round(g.top), bottom: round(g.bottom) })),
      events: st.events.filter((e) => e.i >= off).slice(-8).map((e) => ({ ...e, i: e.i - off, from: Math.max(0, e.from - off), level: round(e.level) })),
      support: round(sup), resistance: round(res),
      buySide: liq.buySide && round(liq.buySide.level), sellSide: liq.sellSide && round(liq.sellSide.level),
    },
  }
}

function marketStatus(now = new Date()) {
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const mins = ny.getHours() * 60 + ny.getMinutes(), d = ny.getDay()
  const open = d >= 1 && d <= 5 && mins >= 570 && mins < 960
  return open ? 'open' : 'closed'
}

async function main() {
  const universe = await loadUniverse()
  console.log(`Escaneando ${universe.length} acciones…`)
  await mkdir(path.join(OUT, 'c'), { recursive: true })
  const results = []
  let idx = 0, fails = 0
  async function worker() {
    while (idx < universe.length) {
      const sym = universe[idx++]
      const d = await fetchCandles(sym.symbol)
      const a = d && analyze(sym, d)
      if (!a) { fails++; continue }
      results.push(a.summary)
      await writeFile(path.join(OUT, 'c', `${sym.symbol}.json`), JSON.stringify(a.chart))
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker))

  const sectors = {}
  for (const s of results) {
    const x = (sectors[s.sector] ||= { sector: s.sector, n: 0, chg: 0, strength: 0, bull: 0, bear: 0 })
    x.n++; x.chg += s.chg; x.strength += s.strength
    if (s.bias === 1) x.bull++
    if (s.bias === -1) x.bear++
  }
  const sectorList = Object.values(sectors).map((x) => ({ ...x, chg: round(x.chg / x.n), strength: round(x.strength / x.n, 0) }))
    .sort((a, b) => b.strength - a.strength)

  const out = {
    updated: new Date().toISOString(), market: marketStatus(), count: results.length, fails,
    breadth: { bull: results.filter((s) => s.bias === 1).length, bear: results.filter((s) => s.bias === -1).length, up: results.filter((s) => s.chg > 0).length, down: results.filter((s) => s.chg < 0).length },
    sectors: sectorList, stocks: results.sort((a, b) => b.strength - a.strength),
  }
  await writeFile(path.join(OUT, 'scan.json'), JSON.stringify(out))
  console.log(`OK: ${results.length} acciones, ${fails} fallos → ${OUT}`)
  if (results.length < universe.length * 0.5) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
