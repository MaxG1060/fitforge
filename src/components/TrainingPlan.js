'use client'

import { useState } from 'react'
import { useToast } from './ToastProvider'

const SPORTS = ['Gym', 'Running', 'Road cycling', 'Yoga', 'Pilates', 'Padel', 'Boxing', 'Swimming', 'HIIT', 'Hiking', 'Rowing']
const DEFAULT_SPORTS = ['Gym', 'Running']

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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold text-zinc-200 min-w-0 truncate">This Week&apos;s Training Plan</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : plan ? 'Regenerate' : 'Generate plan'}
        </button>
      </div>
      <p className="text-sm text-zinc-500 mb-4">
        Functional fitness + fat loss · tailored to your recent Strava activity
        {generatedAt && ` · generated ${formatWhen(generatedAt)}`}
      </p>

      <div className="mb-4">
        <p className="text-xs font-medium text-zinc-400 mb-2">Sports for this week</p>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((s) => {
            const active = sports.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSport(s)}
                disabled={loading}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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

      {plan && !loading && (
        <div>
          <MarkdownRenderer content={plan} />
        </div>
      )}

      {!plan && !loading && (
        <p className="text-sm text-zinc-500">Click &quot;Generate plan&quot; to get your AI-tailored weekly training.</p>
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

function MarkdownRenderer({ content }) {
  const lines = content.split('\n')
  const elements = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-orange-400 font-semibold text-base mt-5 mb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-zinc-300 font-medium text-sm mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={key++} className="text-zinc-400 text-sm ml-4 list-disc">{line.slice(2)}</li>)
    } else if (line.trim() === '') {
      elements.push(<br key={key++} />)
    } else {
      elements.push(<p key={key++} className="text-zinc-400 text-sm">{line}</p>)
    }
  }

  return <div>{elements}</div>
}
