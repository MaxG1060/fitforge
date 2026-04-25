'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './ToastProvider'

export default function WhoopWidget({ connected, recovery, sleep, cycle }) {
  const router = useRouter()
  const toast = useToast()
  const [syncing, setSyncing] = useState(false)

  async function sync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/whoop/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(`Synced ${data.recovery} recoveries, ${data.sleep} sleeps, ${data.cycles} cycles.`)
      router.refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSyncing(false)
    }
  }

  if (!connected) {
    return (
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">WHOOP</p>
        <h3 className="text-xl font-black tracking-tight mb-2">Recovery, sleep & strain</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Connect WHOOP to see today&apos;s metrics.
        </p>
        <a
          href="/api/whoop/connect"
          className="inline-block rounded-md bg-emerald-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-emerald-400 transition-colors"
        >
          Connect WHOOP
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">WHOOP · Today</p>
          <h3 className="mt-1 text-xl font-black tracking-tight truncate">Recovery, sleep & strain</h3>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Ring
          label="Recovery"
          value={recovery?.score}
          max={100}
          color={percentColor(recovery?.score)}
          renderValue={(v) => Math.round(v)}
          unit="%"
          sub={recovery?.hrv_ms ? `HRV ${Math.round(recovery.hrv_ms)}ms` : null}
          sub2={recovery?.resting_hr ? `RHR ${Math.round(recovery.resting_hr)}` : null}
        />
        <Ring
          label="Sleep"
          value={sleep?.performance_pct}
          max={100}
          color={percentColor(sleep?.performance_pct)}
          renderValue={(v) => Math.round(v)}
          unit="%"
          sub={sleep?.duration_min ? formatDuration(sleep.duration_min) : null}
          sub2={sleep?.efficiency_pct ? `${Math.round(sleep.efficiency_pct)}% efficient` : null}
        />
        <Ring
          label="Strain"
          value={cycle?.strain}
          max={21}
          color={strainColor(cycle?.strain)}
          renderValue={(v) => v.toFixed(1)}
          unit=""
          sub={cycle?.avg_hr ? `avg HR ${Math.round(cycle.avg_hr)}` : null}
          sub2={cycle?.max_hr ? `max HR ${Math.round(cycle.max_hr)}` : null}
        />
      </div>
    </div>
  )
}

function Ring({ label, value, max, color, renderValue, unit, sub, sub2 }) {
  const size = 120
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value != null ? Math.min(value / max, 1) : 0
  const dash = c * pct

  return (
    <div className="rounded-lg border border-zinc-900 bg-black p-4 flex flex-col items-center">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2 self-start">{label}</p>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#27272a"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
        />
      </svg>
      <div className="-mt-[78px] flex flex-col items-center pointer-events-none">
        <span className="text-3xl font-black tracking-tight" style={{ color: value != null ? color : '#71717a' }}>
          {value != null ? renderValue(value) : '—'}
          {value != null && unit && <span className="text-sm text-zinc-400">{unit}</span>}
        </span>
      </div>
      <div className="mt-12 text-center min-h-[32px]">
        {sub && <p className="text-xs text-zinc-400">{sub}</p>}
        {sub2 && <p className="text-xs text-zinc-500">{sub2}</p>}
      </div>
    </div>
  )
}

function hsl(h, s, l) {
  return `hsl(${h.toFixed(0)} ${s}% ${l}%)`
}

function percentColor(pct) {
  if (pct == null) return '#71717a'
  const clamped = Math.max(0, Math.min(100, pct))
  const hue = (clamped / 100) * 120
  return hsl(hue, 70, 50)
}

function strainColor(strain) {
  if (strain == null) return '#71717a'
  const s = Math.max(0, Math.min(21, strain))
  let hue
  if (s <= 13) hue = (s / 13) * 120
  else if (s <= 18) hue = 120
  else hue = 120 - ((s - 18) / 3) * 90
  return hsl(hue, 75, 50)
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}
