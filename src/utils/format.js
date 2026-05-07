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
  if (l === 'amanda' || l.startsWith('amanda')) return 'Amanda'
  if (l.includes('tarjeta')) return 'Tarjetas'
  if (l.includes('auto') || l.includes('seguro') || l.includes('prevision') || l.includes('patente')) return 'Auto'
  if (l.includes('expensa') || l.includes('abl') || l.includes('limpieza') || l.includes('alquiler')) return 'Casa'
  if (l.includes('super') || l.includes('mercado') || l.includes('coto') || l.includes('jumbo') || l.includes('carrefour')) return 'Comida'
  if (l.includes('psicól') || l.includes('psicologo') || l.includes('pilates') || l.includes('gimnasio') || l.includes('peluquer') || l.includes('farmacia') || l.includes('médico') || l.includes('medico')) return 'Cuidado Personal'
  if (l.includes('rappi') || l.includes('pedidos') || l.includes('delivery') || l.includes('ifood')) return 'Delivery'
  if (l.includes('netflix') || l.includes('spotify') || l.includes('youtube') || l.includes('disney') || l.includes('hbo') || l.includes('prime') || l.includes('steam') || l.includes('entretenimiento')) return 'Entretenimiento'
  if (l.includes('monotributo') || l.includes('afip') || l.includes('impuesto') || l.includes('metrogas') || l.includes('edenor') || l.includes('teléfono') || l.includes('telefono') || l.includes('internet') || l.includes('servicios') || l.includes('personal flow') || l.includes('flow')) return 'Impuestos y Servicios'
  if (l.includes('ahorro') || l.includes('inversion') || l.includes('inversión') || l.includes('plazo fijo') || l.includes('dolar') || l.includes('dólar')) return 'Ahorro'
  if (l.includes('restaurant') || l.includes('bar') || l.includes('salida') || l.includes('cine') || l.includes('teatro') || l.includes('viaje') || l.includes('hotel')) return 'Salidas'
  return 'Otros'
}

export const CATEGORY_COLORS = {
  Ahorro:                  '#3E7D58',
  Amanda:                  '#C47A8C',
  Auto:                    '#5C7EA8',
  Casa:                    '#B8914A',
  Comida:                  '#6B9E6B',
  'Cuidado Personal':      '#6B9DB0',
  Delivery:                '#C07A5C',
  Entretenimiento:         '#8A7AB0',
  'Impuestos y Servicios': '#4A7A90',
  Otros:                   '#9A9080',
  Salidas:                 '#B85C72',
  Tarjetas:                '#B85050',
}
