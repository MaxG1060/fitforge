'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './ToastProvider'

export default function OuraWidget({ connected, readiness, sleep }) {
  const router = useRouter()
  const toast = useToast()
  const [syncing, setSyncing] = useState(false)

  async function sync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/oura/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(`Synced ${data.readiness} readiness, ${data.sleep} sleeps.`)
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
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Oura</p>
        <h3 className="text-xl font-black tracking-tight mb-2">Readiness & sleep</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Connect Oura to see today&apos;s scores.
        </p>
        <a
          href="/api/oura/connect"
          className="inline-block rounded-md bg-violet-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-violet-400 transition-colors"
        >
          Connect Oura
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Oura · Today</p>
          <h3 className="mt-1 text-xl font-black tracking-tight truncate">Readiness & sleep</h3>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Ring
          label="Readiness"
          value={readiness?.score}
          color={percentColor(readiness?.score)}
          sub={readiness?.hrv_balance != null ? `HRV balance ${readiness.hrv_balance}` : null}
          sub2={readiness?.resting_hr != null ? `RHR contrib ${readiness.resting_hr}` : null}
        />
        <Ring
          label="Sleep"
          value={sleep?.score}
          color={percentColor(sleep?.score)}
          sub={sleep?.total_sleep_min != null ? `Total ${sleep.total_sleep_min}` : null}
          sub2={sleep?.efficiency != null ? `Efficiency ${sleep.efficiency}` : null}
        />
      </div>
    </div>
  )
}

function Ring({ label, value, color, sub, sub2 }) {
  const size = 120
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value != null ? Math.min(value / 100, 1) : 0
  const dash = c * pct

  return (
    <div className="rounded-lg border border-zinc-900 bg-black p-4 flex flex-col items-center">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2 self-start">{label}</p>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#27272a" strokeWidth={stroke} fill="none" />
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
          {value != null ? Math.round(value) : '—'}
          {value != null && <span className="text-sm text-zinc-400">%</span>}
        </span>
      </div>
      <div className="mt-12 text-center min-h-[32px]">
        {sub && <p className="text-xs text-zinc-400">{sub}</p>}
        {sub2 && <p className="text-xs text-zinc-500">{sub2}</p>}
      </div>
    </div>
  )
}

function percentColor(pct) {
  if (pct == null) return '#71717a'
  const clamped = Math.max(0, Math.min(100, pct))
  const hue = (clamped / 100) * 120
  return `hsl(${hue.toFixed(0)} 70% 50%)`
}
