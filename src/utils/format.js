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
  if (!name) return 'Sin categoría'
  const l = name.toLowerCase()
  if (l.includes('metrogas') || l.includes('edenor')) return 'Servicios'
  if (l.includes('flow') || l.includes('teléfono') || l.includes('telefono')) return 'Telefonía'
  if (l.includes('abl') || l.includes('expensa')) return 'Vivienda'
  if (l.includes('tarjeta')) return 'Tarjetas'
  if (l.includes('super')) return 'Supermercado'
  if (l.includes('psicól') || l.includes('psicologo') || l.includes('pilates') || l.includes('gimnasio') || l.includes('amanda')) return 'Salud'
  if (l.includes('monotributo')) return 'Impuestos'
  if (l.includes('limpieza')) return 'Hogar'
  if (l.includes('auto') || l.includes('seguro') || l.includes('prevision') || l.includes('patente')) return 'Auto'
  return 'Otros'
}

export const CATEGORY_COLORS = {
  Servicios: '#3b82f6',
  Telefonía: '#8b5cf6',
  Vivienda: '#f59e0b',
  Tarjetas: '#ef4444',
  Supermercado: '#10b981',
  Salud: '#06b6d4',
  Impuestos: '#f97316',
  Hogar: '#84cc16',
  Auto: '#6366f1',
  Otros: '#94a3b8',
  'Sin categoría': '#cbd5e1',
}
