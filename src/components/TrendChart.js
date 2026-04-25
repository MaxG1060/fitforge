'use client'

import { useRef, useState } from 'react'

const METRICS = [
  { key: 'weight', label: 'Weight', unit: 'kg', source: 'body', field: 'weight_kg', color: '#f97316' },
  { key: 'body_fat', label: 'Body Fat', unit: '%', source: 'body', field: 'body_fat_pct', color: '#ec4899' },
  { key: 'muscle', label: 'Muscle', unit: 'kg', source: 'body', field: 'muscle_mass_kg', color: '#14b8a6' },
  { key: 'recovery', label: 'Recovery', unit: '%', source: 'recovery', field: 'score', color: '#22c55e', min: 0, max: 100, integer: true },
  { key: 'sleep', label: 'Sleep', unit: '%', source: 'sleep', field: 'performance_pct', color: '#60a5fa', min: 0, max: 100, integer: true },
  { key: 'strain', label: 'Strain', unit: '', source: 'cycle', field: 'strain', color: '#a855f7', min: 0, max: 21, integer: true },
]

export default function TrendChart({ body, recovery, sleep, cycle }) {
  const available = METRICS.filter((m) => {
    const data = pickSource(m.source, { body, recovery, sleep, cycle })
    return data.some((d) => d[m.field] != null)
  })

  const [activeKey, setActiveKey] = useState(available[0]?.key ?? 'weight')
  const meta = METRICS.find((m) => m.key === activeKey) ?? METRICS[0]
  const sourceData = pickSource(meta.source, { body, recovery, sleep, cycle })
  const dateField = meta.source === 'body' ? 'recorded_at' : 'date'

  const points = sourceData
    .map((d) => ({ t: new Date(d[dateField]).getTime(), v: d[meta.field] }))
    .filter((p) => p.v != null && !Number.isNaN(p.t))
    .sort((a, b) => a.t - b.t)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-zinc-200 min-w-0 truncate">Trend</h3>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {METRICS.map((m) => {
          const isAvailable = available.some((a) => a.key === m.key)
          const active = activeKey === m.key
          return (
            <button
              key={m.key}
              onClick={() => isAvailable && setActiveKey(m.key)}
              disabled={!isAvailable}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'text-white'
                  : isAvailable
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
              }`}
              style={active ? { backgroundColor: m.color } : undefined}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {points.length < 2 ? (
        <p className="text-sm text-zinc-500">
          Need at least 2 data points for {meta.label.toLowerCase()} to show a trend.
        </p>
      ) : (
        <Chart points={points} unit={meta.unit} color={meta.color} fixedMin={meta.min} fixedMax={meta.max} integer={meta.integer} />
      )}
    </div>
  )
}

function pickSource(source, sources) {
  return sources[source] ?? []
}

function Chart({ points, unit, color, fixedMin, fixedMax, integer }) {
  const fmt = (n) => (integer ? Math.round(n).toString() : n.toFixed(1))
  const W = 600
  const H = 200
  const PAD_L = 40
  const PAD_R = 12
  const PAD_T = 12
  const PAD_B = 28
  const svgRef = useRef(null)
  const [hoverIdx, setHoverIdx] = useState(null)

  const values = points.map((p) => p.v)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const yMin = fixedMin != null ? fixedMin : minV - range * 0.1
  const yMax = fixedMax != null ? fixedMax : maxV + range * 0.1

  const minT = points[0].t
  const maxT = points[points.length - 1].t
  const tRange = maxT - minT || 1

  const x = (t) => PAD_L + ((t - minT) / tRange) * (W - PAD_L - PAD_R)
  const y = (v) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD_T - PAD_B)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
  const areaPath = `${path} L ${x(maxT)} ${H - PAD_B} L ${x(minT)} ${H - PAD_B} Z`

  const yTicks = [yMin, (yMin + yMax) / 2, yMax]
  const first = points[0]
  const last = points[points.length - 1]
  const delta = last.v - first.v
  const deltaPct = first.v !== 0 ? (delta / first.v) * 100 : 0

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-bold text-zinc-100">
            {fmt(last.v)}
          </span>
          {unit && <span className="ml-1 text-sm text-zinc-400">{unit}</span>}
        </div>
        <div
          className={`text-sm font-medium ${
            delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-zinc-400'
          }`}
        >
          {delta >= 0 ? '+' : ''}
          {fmt(delta)}
          {unit && ` ${unit}`} ({deltaPct >= 0 ? '+' : ''}
          {deltaPct.toFixed(1)}%)
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseMove={(e) => {
          const rect = svgRef.current.getBoundingClientRect()
          const svgX = ((e.clientX - rect.left) / rect.width) * W
          let nearest = 0
          let bestDist = Infinity
          for (let i = 0; i < points.length; i++) {
            const dist = Math.abs(svgX - x(points[i].t))
            if (dist < bestDist) {
              bestDist = dist
              nearest = i
            }
          }
          setHoverIdx(nearest)
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`area-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#27272a"
              strokeDasharray="2 4"
            />
            <text
              x={PAD_L - 6}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-zinc-500"
              fontSize="11"
            >
              {fmt(tick)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#area-${color.replace('#', '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" />

        {points.map((p, i) => (
          <circle key={i} cx={x(p.t)} cy={y(p.v)} r="3" fill={color} />
        ))}

        {hoverIdx !== null && (() => {
          const hp = points[hoverIdx]
          const hx = x(hp.t)
          const hy = y(hp.v)
          const label = new Date(hp.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          const valueText = `${fmt(hp.v)}${unit ? ` ${unit}` : ''}`
          const tipW = 120
          const tipH = 38
          let tipX = hx + 10
          if (tipX + tipW > W - PAD_R) tipX = hx - 10 - tipW
          let tipY = hy - tipH - 8
          if (tipY < PAD_T) tipY = hy + 8
          return (
            <g pointerEvents="none">
              <line x1={hx} x2={hx} y1={PAD_T} y2={H - PAD_B} stroke={color} strokeOpacity="0.4" strokeDasharray="3 3" />
              <circle cx={hx} cy={hy} r="5" fill={color} stroke="#0a0a0a" strokeWidth="2" />
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="4" fill="#18181b" stroke="#3f3f46" />
              <text x={tipX + 8} y={tipY + 15} className="fill-zinc-400" fontSize="10">{label}</text>
              <text x={tipX + 8} y={tipY + 30} className="fill-zinc-100" fontSize="12" fontWeight="600">{valueText}</text>
            </g>
          )
        })()}

        <text
          x={PAD_L}
          y={H - 8}
          className="fill-zinc-500"
          fontSize="11"
        >
          {new Date(minT).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </text>
        <text
          x={W - PAD_R}
          y={H - 8}
          textAnchor="end"
          className="fill-zinc-500"
          fontSize="11"
        >
          {new Date(maxT).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </text>
      </svg>
    </div>
  )
}
