export function formatARS(amount) {
  if (amount == null || isNaN(amount)) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

export function formatARSShort(amount) {
  if (amount == null || isNaN(amount)) return '-'
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`
  return `$${Math.round(amount)}`
}

export function getCategory(name) {
  if (!name) return 'Otros'
  const l = name.toLowerCase()
  if (l.includes('metrogas') || l.includes('edenor') || l.includes('agua') || (l.includes('gas') && !l.includes('gasto'))) return 'Servicios'
  if (l.includes('flow') || l.includes('teléfono') || l.includes('telefono') || l.includes('netflix') || l.includes('spotify') || l.includes('linkedin') || l.includes('youtube') || l.includes('apple') || l.includes('claude') || l.includes('duty free') || l.includes('alarm') || l.includes('premium') || l.includes('suscri')) return 'Suscripciones'
  if (l.includes('abl') || l.includes('expensa')) return 'Vivienda'
  if (l.includes('tarjeta')) return 'Tarjetas'
  if (l.includes('super') || l.includes('mercado') || l.includes('coto') || l.includes('jumbo') || l.includes('carrefour')) return 'Alimentación'
  if (l.includes('psicól') || l.includes('psicologo') || l.includes('pilates') || l.includes('gimnasio') || l.includes('amanda') || l.includes('salud') || l.includes('médico') || l.includes('medico')) return 'Salud'
  if (l.includes('monotributo') || l.includes('impuesto') || l.includes('patente') || l.includes('afip')) return 'Impuestos'
  if (l.includes('limpieza')) return 'Hogar'
  if (l.includes('auto') || l.includes('seguro') || l.includes('prevision') || l.includes('nafta') || l.includes('combustible')) return 'Auto'
  return 'Otros'
}

export const CATEGORY_COLORS = {
  Servicios: '#3b82f6',
  Suscripciones: '#8b5cf6',
  Vivienda: '#f59e0b',
  Tarjetas: '#ef4444',
  Alimentación: '#10b981',
  Salud: '#06b6d4',
  Impuestos: '#f97316',
  Hogar: '#84cc16',
  Auto: '#6366f1',
  Otros: '#94a3b8',
}
