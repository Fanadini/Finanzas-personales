function binaryLayout(items, x, y, w, h) {
  if (!items.length) return []
  if (items.length === 1) return [{ ...items[0], x, y, w, h }]

  const total = items.reduce((s, i) => s + i.value, 0)

  let split = 1
  let acc = items[0].value
  while (split < items.length - 1 && acc < total / 2) {
    acc += items[split++].value
  }

  const leftFrac = acc / total
  const left = items.slice(0, split)
  const right = items.slice(split)

  if (w >= h) {
    const lw = w * leftFrac
    return [
      ...binaryLayout(left, x, y, lw, h),
      ...binaryLayout(right, x + lw, y, w - lw, h),
    ]
  } else {
    const lh = h * leftFrac
    return [
      ...binaryLayout(left, x, y, w, lh),
      ...binaryLayout(right, x, y + lh, w, h - lh),
    ]
  }
}

export default function Treemap({ data, height = 180 }) {
  const items = data.filter(d => d.value > 0).sort((a, b) => b.value - a.value)
  if (!items.length) return null

  const W = 320
  const tiles = binaryLayout(items, 0, 0, W, height)
  const total = items.reduce((s, d) => s + d.value, 0)

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full rounded-xl overflow-hidden" style={{ height }}>
      {tiles.map(t => {
        const pct = Math.round((t.value / total) * 100)
        const showName = t.w > 44 && t.h > 22
        const showPct = t.w > 54 && t.h > 42
        return (
          <g key={t.name}>
            <rect
              x={t.x + 0.5} y={t.y + 0.5}
              width={Math.max(t.w - 1, 0.5)} height={Math.max(t.h - 1, 0.5)}
              fill={t.color} rx="3"
            />
            {showName && (
              <text
                x={t.x + 6} y={t.y + (showPct ? t.h - 16 : t.h / 2 + 3)}
                fontSize="9" fill="white" fontWeight="600"
              >
                {t.name.length > 13 ? t.name.slice(0, 13) + '…' : t.name}
              </text>
            )}
            {showPct && (
              <text x={t.x + 6} y={t.y + t.h - 6} fontSize="8" fill="rgba(255,255,255,0.7)">
                {pct}%
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
