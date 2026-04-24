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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="font-semibold text-zinc-200 mb-2">Recent Workouts</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Connect your Strava account to auto-sync runs, rides, and gym sessions.
        </p>
        <a
          href="/api/strava/connect"
          className="inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Connect Strava
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-200 truncate">Recent Workouts</h3>
          <p className="text-sm text-zinc-500 truncate">Synced from Strava</p>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {workouts.length === 0 ? (
        <p className="text-sm text-zinc-500">No workouts yet — click &quot;Sync now&quot; to pull your latest activities.</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {workouts.map((w) => (
            <li key={w.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{w.name || w.sport_type}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(w.started_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' · '}{w.sport_type}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-400 shrink-0">
                {w.distance_m > 0 && <div>{(w.distance_m / 1000).toFixed(2)} km</div>}
                {w.moving_time_s > 0 && <div>{formatDuration(w.moving_time_s)}</div>}
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
