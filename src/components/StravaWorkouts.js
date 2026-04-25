'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './ToastProvider'

export default function StravaWorkouts({ connected, workouts }) {
  const router = useRouter()
  const toast = useToast()
  const [syncing, setSyncing] = useState(false)

  async function sync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(`Synced ${data.synced} ${data.synced === 1 ? 'activity' : 'activities'}.`)
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
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Strava</p>
        <h3 className="text-xl font-black tracking-tight mb-2">Recent Workouts</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Connect your Strava account to auto-sync runs, rides, and gym sessions.
        </p>
        <a
          href="/api/strava/connect"
          className="inline-block rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors"
        >
          Connect Strava
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Strava · Recent</p>
          <h3 className="mt-1 text-xl font-black tracking-tight truncate">Workouts</h3>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {workouts.length === 0 ? (
        <p className="text-sm text-zinc-500">No workouts yet — click &quot;Sync&quot; to pull your latest activities.</p>
      ) : (
        <ul className="divide-y divide-zinc-900">
          {workouts.map((w) => (
            <li key={w.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{w.name || w.sport_type}</p>
                <p className="text-[11px] tracking-wider uppercase text-zinc-500 mt-0.5">
                  {new Date(w.started_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}{w.sport_type}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-300 shrink-0 font-medium tabular-nums">
                {w.distance_m > 0 && <div>{(w.distance_m / 1000).toFixed(2)} km</div>}
                {w.moving_time_s > 0 && <div className="text-zinc-500">{formatDuration(w.moving_time_s)}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
