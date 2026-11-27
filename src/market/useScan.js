import { useCallback, useEffect, useState } from 'react'

const BASE = `${import.meta.env.BASE_URL}data/`

export function useScan() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}scan.json?t=${Date.now()}`)
      if (!r.ok) throw new Error('Todavía no hay datos del escáner')
      setData(await r.json())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [load])

  return { data, error, loading, refresh: load }
}

const chartCache = {}
export async function loadChart(symbol) {
  if (!chartCache[symbol]) {
    chartCache[symbol] = fetch(`${BASE}c/${symbol}.json`).then((r) => {
      if (!r.ok) throw new Error('Sin gráfico')
      return r.json()
    })
    chartCache[symbol].catch(() => delete chartCache[symbol])
  }
  return chartCache[symbol]
}
