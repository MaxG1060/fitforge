'use client'

import { useState } from 'react'

export default function MealPlan({ savedPlan, savedAt }) {
  const [plan, setPlan] = useState(savedPlan ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(savedAt ?? null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/meal-plan', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlan(data.plan)
      setGeneratedAt(new Date().toISOString())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold text-zinc-200 min-w-0 truncate">Sunday Meal Prep</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : plan ? 'Regenerate' : 'Generate plan'}
        </button>
      </div>
      <p className="text-sm text-zinc-500 mb-4">
        5 high-protein meals · 2.5g protein/kg · batch-cook ready
        {generatedAt && ` · generated ${formatWhen(generatedAt)}`}
      </p>

      {error && (
        <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${70 + i * 7}%` }} />
          ))}
        </div>
      )}

      {plan && !loading && (
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 prose-headings:text-orange-400 prose-headings:font-semibold prose-strong:text-zinc-200">
          <MarkdownRenderer content={plan} />
        </div>
      )}

      {!plan && !loading && (
        <p className="text-sm text-zinc-500">Click &quot;Generate plan&quot; to get your AI-tailored meal prep.</p>
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
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={key++} className="text-zinc-200 font-semibold text-sm">{line.slice(2, -2)}</p>)
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
