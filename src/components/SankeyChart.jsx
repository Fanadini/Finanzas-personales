export default function SankeyChart({ categories }) {
  const W = 320
  const H = 200
  const BAR_W = 14
  const PAD = { top: 6, bottom: 6, left: 4, right: 92 }
  const innerH = H - PAD.top - PAD.bottom

  const cats = categories
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  if (!cats.length) return null

  const total = cats.reduce((s, c) => s + c.value, 0)

  let cumY = PAD.top
  const segs = cats.map(c => {
    const h = (c.value / total) * innerH
    const seg = { ...c, y: cumY, h }
    cumY += h
    return seg
  })

  const srcX = PAD.left
  const tgtX = W - PAD.right - BAR_W
  const midX = srcX + BAR_W + (tgtX - srcX - BAR_W) * 0.5

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {segs.map(seg => {
        const top = seg.y
        const bot = seg.y + seg.h
        const path = [
          `M ${srcX + BAR_W} ${top}`,
          `C ${midX} ${top}, ${midX} ${top}, ${tgtX} ${top}`,
          `L ${tgtX} ${bot}`,
          `C ${midX} ${bot}, ${midX} ${bot}, ${srcX + BAR_W} ${bot}`,
          'Z',
        ].join(' ')

        return (
          <g key={seg.name}>
            <path d={path} fill={seg.color} opacity="0.18" />
            <rect
              x={srcX} y={seg.y + 0.5}
              width={BAR_W} height={Math.max(seg.h - 1, 0.5)}
              fill={seg.color} rx="2"
            />
            <rect
              x={tgtX} y={seg.y + 0.5}
              width={BAR_W} height={Math.max(seg.h - 1, 0.5)}
              fill={seg.color} rx="2"
            />
            {seg.h > 13 && (
              <text
                x={tgtX + BAR_W + 5}
                y={seg.y + seg.h / 2 + 3}
                fontSize="8.5" fill="#3F4F44" fontWeight="500"
              >
                {seg.name.length > 13 ? seg.name.slice(0, 13) + '…' : seg.name}
              </text>
            )}
          </g>
        )
      })}
      <text
        x={srcX + BAR_W / 2} y={H - 1}
        textAnchor="middle" fontSize="7.5" fill="#9A9080"
      >
        Total
      </text>
    </svg>
  )
}
