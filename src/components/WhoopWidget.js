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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="font-semibold text-zinc-200 mb-2">WHOOP Recovery</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Connect WHOOP to see today&apos;s recovery, sleep, and strain.
        </p>
        <a
          href="/api/whoop/connect"
          className="inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Connect WHOOP
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-200 truncate">WHOOP Today</h3>
          <p className="text-sm text-zinc-500 truncate">Recovery, sleep, and strain</p>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Ring
          label="Recovery"
          value={recovery?.score}
          max={100}
          color={recoveryColor(recovery?.score)}
          renderValue={(v) => Math.round(v)}
          unit="%"
          sub={recovery?.hrv_ms ? `HRV ${Math.round(recovery.hrv_ms)}ms` : null}
          sub2={recovery?.resting_hr ? `RHR ${Math.round(recovery.resting_hr)}` : null}
        />
        <Ring
          label="Sleep"
          value={sleep?.performance_pct}
          max={100}
          color="#60a5fa"
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col items-center">
      <p className="text-xs text-zinc-500 mb-2 self-start">{label}</p>
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
        <span className="text-2xl font-bold" style={{ color: value != null ? color : '#71717a' }}>
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

function recoveryColor(score) {
  if (score == null) return '#71717a'
  if (score >= 67) return '#22c55e'
  if (score >= 34) return '#eab308'
  return '#ef4444'
}

function strainColor(strain) {
  if (strain == null) return '#71717a'
  if (strain >= 18) return '#ef4444'
  if (strain >= 14) return '#f97316'
  if (strain >= 10) return '#3b82f6'
  return '#60a5fa'
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}
