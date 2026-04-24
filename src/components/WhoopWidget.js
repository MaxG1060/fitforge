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
      <div className="flex items-center justify-between gap-3 mb-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric
          label="Recovery"
          value={recovery?.score != null ? Math.round(recovery.score) : null}
          unit="%"
          color={recoveryColor(recovery?.score)}
          sub={recovery?.hrv_ms ? `HRV ${Math.round(recovery.hrv_ms)}ms` : null}
        />
        <Metric
          label="Sleep"
          value={sleep?.duration_min != null ? formatDuration(sleep.duration_min) : null}
          unit=""
          color="text-blue-400"
          sub={sleep?.performance_pct ? `${Math.round(sleep.performance_pct)}% performance` : null}
        />
        <Metric
          label="Strain"
          value={cycle?.strain != null ? cycle.strain.toFixed(1) : null}
          unit=""
          color="text-orange-400"
          sub={cycle?.avg_hr ? `avg HR ${Math.round(cycle.avg_hr)}` : null}
        />
      </div>
    </div>
  )
}

function Metric({ label, value, unit, color, sub }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? 'text-zinc-100'}`}>
        {value ?? '—'}
        {value != null && unit && <span className="ml-0.5 text-base font-normal text-zinc-400">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

function recoveryColor(score) {
  if (score == null) return 'text-zinc-100'
  if (score >= 67) return 'text-green-400'
  if (score >= 34) return 'text-yellow-400'
  return 'text-red-400'
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}
