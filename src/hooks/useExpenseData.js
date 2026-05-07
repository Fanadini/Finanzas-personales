import { useState, useEffect } from 'react'
import Papa from 'papaparse'

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1FoOcahWHyY6bpG0YjFoqcRNVEHlMQI0n1sT3n94a7zc/pub?output=csv&gid=1253309126'

const CACHE_KEY = 'expense_data_v1'
const CACHE_TTL = 0

const MONTH_MAP = {
  january: 1, enero: 1,
  february: 2, febrero: 2,
  march: 3, marzo: 3,
  april: 4, abril: 4,
  may: 5, mayo: 5,
  june: 6, junio: 6,
  july: 7, julio: 7,
  august: 8, agosto: 8,
  september: 9, septiembre: 9,
  october: 10, octubre: 10,
  november: 11, noviembre: 11,
  december: 12, diciembre: 12,
}

const MONTH_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function parseAmount(str) {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  if (!trimmed || trimmed === '-' || trimmed === '#N/A' || trimmed === 'N/A') return null
  if (trimmed.includes('%')) return null

  let cleaned = trimmed.replace(/[$€\s]/g, '')
  if (!cleaned) return null

  const hasComma = cleaned.includes(',')
  const hasPeriod = cleaned.includes('.')

  if (hasComma && hasPeriod) {
    const lastComma = cleaned.lastIndexOf(',')
    const lastPeriod = cleaned.lastIndexOf('.')
    if (lastComma > lastPeriod) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = cleaned.split(',')
    if (parts[1]?.length <= 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasPeriod) {
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1]?.length === 3) {
      cleaned = cleaned.replace(/\./g, '')
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseMonthHeader(header) {
  if (!header) return null
  const trimmed = header.trim()
  // Handles both "RealMarzo24" and "Real Marzo 2026" (with or without spaces)
  const match = trimmed.match(
    /^(Real|Estimado?)\s*([A-Za-záéíóúüÁÉÍÓÚÜ]+)\s*(\d{2,4})$/i
  )
  if (!match) return null

  const type = match[1].toLowerCase() === 'real' ? 'real' : 'estimated'
  const monthStr = match[2].toLowerCase()
  const yearStr = match[3]
  const year = yearStr.length === 2 ? parseInt('20' + yearStr) : parseInt(yearStr)
  const monthNum = MONTH_MAP[monthStr]

  if (!monthNum || !year) return null

  const key = `${year}-${String(monthNum).padStart(2, '0')}`
  const label = `${MONTH_ES[monthNum]} ${year}`

  return { type, year, month: monthNum, key, label }
}

const SKIP_ROW_NAMES = /^(total|subtotal|suma|sum|promedio|ipc)$/i

function processData(rows) {
  if (!rows?.length) throw new Error('Sin datos')

  // Find header row
  let headerRowIdx = 0
  while (headerRowIdx < rows.length && !rows[headerRowIdx]?.[0]?.trim()) {
    headerRowIdx++
  }

  const headerRow = rows[headerRowIdx]

  // Parse month columns
  const monthCols = []
  for (let i = 1; i < headerRow.length; i++) {
    const info = parseMonthHeader(headerRow[i])
    if (info) monthCols.push({ colIdx: i, ...info })
  }

  if (!monthCols.length) throw new Error('No se encontraron columnas de meses en la planilla')

  // Unique months sorted
  const uniqueMonthKeys = [...new Set(monthCols.map(c => c.key))].sort()
  const months = uniqueMonthKeys.map(key => {
    const col = monthCols.find(c => c.key === key)
    return { key, label: col.label, year: col.year, month: col.month }
  })

  // Parse expense rows
  const expenses = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[0]?.trim()
    if (!name) continue
    if (SKIP_ROW_NAMES.test(name)) continue

    const monthData = {}
    for (const mc of monthCols) {
      if (!monthData[mc.key]) monthData[mc.key] = { estimated: null, real: null }
      const amount = parseAmount(row[mc.colIdx])
      if (mc.type === 'real') {
        monthData[mc.key].real = amount
      } else {
        monthData[mc.key].estimated = amount
      }
    }

    for (const mk of uniqueMonthKeys) {
      if (!monthData[mk]) monthData[mk] = { estimated: null, real: null }
    }

    const hasData = Object.values(monthData).some(
      m => m.real !== null || m.estimated !== null
    )
    if (!hasData) continue

    expenses.push({ name, monthData })
  }

  // Monthly totals
  const monthTotals = {}
  for (const mk of uniqueMonthKeys) {
    let sumReal = 0, countReal = 0, sumEst = 0, countEst = 0
    for (const exp of expenses) {
      const md = exp.monthData[mk]
      if (md?.real != null) { sumReal += md.real; countReal++ }
      if (md?.estimated != null) { sumEst += md.estimated; countEst++ }
    }
    monthTotals[mk] = {
      real: countReal > 0 ? sumReal : null,
      estimated: countEst > 0 ? sumEst : null,
    }
  }

  // Latest month with real data
  const latestWithReal = uniqueMonthKeys
    .filter(k => monthTotals[k].real !== null)
    .sort()
    .at(-1)

  const now = new Date()
  const currentKey =
    latestWithReal ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return { expenses, months, monthTotals, currentMonthKey: currentKey }
}

export function useExpenseData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Try fresh cache
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          setData(cachedData)
          setLoading(false)
          return
        }
      }
    } catch {}

    fetch(SHEET_URL)
      .then(r => {
        if (!r.ok) throw new Error(`Error HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        Papa.parse(text, {
          header: false,
          skipEmptyLines: false,
          complete: ({ data: rows }) => {
            try {
              const processed = processData(rows)
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: processed, timestamp: Date.now() }))
              } catch {}
              setData(processed)
            } catch (e) {
              setError(e.message)
            }
            setLoading(false)
          },
          error: e => {
            setError(e.message)
            setLoading(false)
          },
        })
      })
      .catch(e => {
        // Fallback to stale cache
        try {
          const cached = localStorage.getItem(CACHE_KEY)
          if (cached) {
            const { data: cachedData } = JSON.parse(cached)
            setData(cachedData)
            setLoading(false)
            return
          }
        } catch {}
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const refresh = () => {
    try { localStorage.removeItem(CACHE_KEY) } catch {}
    setLoading(true)
    setError(null)
    setData(null)
  }

  return { data, loading, error, refresh }
}
