'use client'

import { useState } from 'react'

const METRICS = [
  { key: 'weight_kg', label: 'Weight', unit: 'kg' },
  { key: 'body_fat_pct', label: 'Body Fat', unit: '%' },
  { key: 'muscle_mass_kg', label: 'Muscle', unit: 'kg' },
]

export default function BodyMetricsChart({ history }) {
  const [metric, setMetric] = useState('weight_kg')
  const active = METRICS.find((m) => m.key === metric)

  const points = history
    .map((h) => ({ t: new Date(h.recorded_at).getTime(), v: h[metric] }))
    .filter((p) => p.v !== null && p.v !== undefined)
    .sort((a, b) => a.t - b.t)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-zinc-200 min-w-0 truncate">Trend</h3>
        <div className="flex gap-1 shrink-0">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                metric === m.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {points.length < 2 ? (
        <p className="text-sm text-zinc-500">
          Log at least 2 entries to see a trend.
        </p>
      ) : (
        <Chart points={points} unit={active.unit} />
      )}
    </div>
  )
}

function Chart({ points, unit }) {
  const W = 600
  const H = 200
  const PAD_L = 40
  const PAD_R = 12
  const PAD_T = 12
  const PAD_B = 28

  const values = points.map((p) => p.v)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const yMin = minV - range * 0.1
  const yMax = maxV + range * 0.1

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
  const deltaPct = (delta / first.v) * 100

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-bold text-zinc-100">
            {last.v.toFixed(1)}
          </span>
          <span className="ml-1 text-sm text-zinc-400">{unit}</span>
        </div>
        <div
          className={`text-sm font-medium ${
            delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-zinc-400'
          }`}
        >
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(1)} {unit} ({deltaPct >= 0 ? '+' : ''}
          {deltaPct.toFixed(1)}%)
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
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
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#area)" />
        <path d={path} fill="none" stroke="#f97316" strokeWidth="2" />

        {points.map((p, i) => (
          <circle key={i} cx={x(p.t)} cy={y(p.v)} r="3" fill="#f97316" />
        ))}

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
