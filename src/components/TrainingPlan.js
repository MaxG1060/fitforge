'use client'

import { useState } from 'react'
import { useToast } from './ToastProvider'
import Markdown from './Markdown'
import SportIcon, { pickIconType } from './SportIcon'

const SPORTS = ['Gym', 'Running', 'Road cycling', 'Yoga', 'Pilates', 'Padel', 'Boxing', 'Swimming', 'HIIT', 'Hiking', 'Rowing']
const DEFAULT_SPORTS = ['Gym', 'Running']

function splitDays(plan) {
  if (!plan) return { intro: '', days: [] }
  const lines = plan.split('\n')
  const days = []
  let current = null
  const intro = []
  let seen = false
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) days.push(current)
      current = { title: line.slice(3).trim(), bodyLines: [] }
      seen = true
    } else if (current) {
      current.bodyLines.push(line)
    } else if (!seen) {
      intro.push(line)
    }
  }
  if (current) days.push(current)
  return {
    intro: intro.join('\n').trim(),
    days: days.map((d) => ({ title: d.title, body: d.bodyLines.join('\n').trim() })),
  }
}

export default function TrainingPlan({ savedPlan, savedAt }) {
  const toast = useToast()
  const [plan, setPlan] = useState(savedPlan ?? null)
  const [loading, setLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState(savedAt ?? null)
  const [sports, setSports] = useState(DEFAULT_SPORTS)

  function toggleSport(s) {
    setSports((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function generate() {
    if (sports.length === 0) {
      toast.error('Pick at least one sport.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sports }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlan(data.plan)
      setGeneratedAt(new Date().toISOString())
      toast.success('Training plan generated.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Plan</p>
          <h3 className="mt-1 text-xl font-black tracking-tight truncate">This Week</h3>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : plan ? 'Regenerate' : 'Generate'}
        </button>
      </div>
      <p className="text-sm text-zinc-500 mb-5">
        Functional fitness + fat loss · tailored to your recent Strava activity
        {generatedAt && ` · generated ${formatWhen(generatedAt)}`}
      </p>

      <div className="mb-5">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2.5">Sports this week</p>
        <div className="flex flex-wrap gap-1.5">
          {SPORTS.map((s) => {
            const active = sports.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSport(s)}
                disabled={loading}
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors disabled:opacity-50 ${
                  active
                    ? 'bg-orange-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${65 + i * 6}%` }} />
          ))}
        </div>
      )}

      {plan && !loading && (() => {
        const parsed = splitDays(plan)
        return (
          <div className="space-y-3">
            {parsed.intro && <Markdown content={parsed.intro} accent="#f97316" />}
            {parsed.days.map((day, i) => (
              <section key={i} className="rounded-lg border border-zinc-900 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500 min-w-0 truncate">
                    {day.title}
                  </h3>
                  <SportIcon
                    type={pickIconType(`${day.title} ${day.body}`)}
                    size={20}
                    className="text-zinc-400 shrink-0"
                  />
                </div>
                <Markdown content={day.body} accent="#f97316" />
              </section>
            ))}
          </div>
        )
      })()}

      {!plan && !loading && (
        <p className="text-sm text-zinc-500">Click &quot;Generate&quot; to get your AI-tailored weekly training.</p>
      )}
    </div>
  )
}

function formatWhen(iso) {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
