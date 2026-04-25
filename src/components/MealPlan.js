'use client'

import { useState } from 'react'
import { useToast } from './ToastProvider'
import Markdown from './Markdown'

const ACCENT = '#10b981'

function splitMeals(plan) {
  if (!plan) return { intro: '', meals: [], outro: '' }
  const lines = plan.split('\n')
  const meals = []
  let current = null
  let intro = []
  let afterAll = []
  let seenMeal = false

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) meals.push(current)
      current = { title: line.slice(3).trim(), bodyLines: [] }
      seenMeal = true
    } else if (current) {
      current.bodyLines.push(line)
    } else if (!seenMeal) {
      intro.push(line)
    }
  }
  if (current) meals.push(current)

  return {
    intro: intro.join('\n').trim(),
    meals: meals.map((m) => ({ title: m.title, body: m.bodyLines.join('\n').trim() })),
    outro: afterAll.join('\n').trim(),
  }
}

function joinMeals({ intro, meals }) {
  const parts = []
  if (intro) parts.push(intro, '')
  for (const m of meals) {
    parts.push(`## ${m.title}`)
    if (m.body) parts.push(m.body)
    parts.push('')
  }
  return parts.join('\n').trim()
}

export default function MealPlan({ savedPlan, savedAt }) {
  const toast = useToast()
  const [plan, setPlan] = useState(savedPlan ?? null)
  const [loading, setLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState(savedAt ?? null)
  const [regenIdx, setRegenIdx] = useState(null)
  const [shoppingList, setShoppingList] = useState(null)
  const [listLoading, setListLoading] = useState(false)
  const [listOpen, setListOpen] = useState(false)

  const parsed = splitMeals(plan)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/meal-plan', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlan(data.plan)
      setGeneratedAt(new Date().toISOString())
      toast.success('Meal plan generated.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function regenerateMeal(index) {
    const meal = parsed.meals[index]
    if (!meal) return
    const hint = window.prompt(
      `Regenerate "${meal.title}". Optional: tell me what you'd like instead (e.g. "vegetarian", "Asian-inspired", "no fish").`,
      ''
    )
    if (hint === null) return

    setRegenIdx(index)
    try {
      const others = parsed.meals.filter((_, i) => i !== index).map((m) => ({ title: m.title }))
      const res = await fetch('/api/meal-plan/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealTitle: meal.title, otherMeals: others, hint: hint.trim() || null }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const newSplit = splitMeals(data.meal)
      const newMeal = newSplit.meals[0]
      if (!newMeal) throw new Error('Could not parse new meal')

      const updated = { ...parsed }
      updated.meals = parsed.meals.map((m, i) => (i === index ? newMeal : m))
      const newPlan = joinMeals(updated)
      setPlan(newPlan)

      const save = await fetch('/api/meal-plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPlan }),
      })
      const saveData = await save.json()
      if (saveData.error) throw new Error(saveData.error)

      toast.success(`"${newMeal.title}" replaced.`)
      setShoppingList(null)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setRegenIdx(null)
    }
  }

  async function deleteMeal(index) {
    const meal = parsed.meals[index]
    if (!meal) return
    if (!window.confirm(`Remove "${meal.title}" from the plan?`)) return

    const updated = { ...parsed }
    updated.meals = parsed.meals.filter((_, i) => i !== index)
    const newPlan = joinMeals(updated)
    setPlan(newPlan)
    setShoppingList(null)

    try {
      const save = await fetch('/api/meal-plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPlan }),
      })
      const saveData = await save.json()
      if (saveData.error) throw new Error(saveData.error)
      toast.success(`"${meal.title}" removed.`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function loadShoppingList() {
    setListOpen(true)
    if (shoppingList) return
    setListLoading(true)
    try {
      const res = await fetch('/api/meal-plan/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plan }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShoppingList(data.list)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setListLoading(false)
    }
  }

  function downloadShoppingList() {
    if (!shoppingList) return
    const blob = new Blob([shoppingList], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopping-list-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Plan</p>
          <h3 className="mt-1 text-xl font-black tracking-tight truncate">Sunday Prep</h3>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : plan ? 'Regenerate all' : 'Generate'}
        </button>
      </div>
      <p className="text-sm text-zinc-500 mb-5">
        5 high-protein meals · 2.5g protein/kg · batch-cook ready
        {generatedAt && ` · generated ${formatWhen(generatedAt)}`}
      </p>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${70 + i * 7}%` }} />
          ))}
        </div>
      )}

      {plan && !loading && (
        <div className="space-y-3">
          {parsed.intro && <Markdown content={parsed.intro} accent={ACCENT} />}
          {parsed.meals.map((meal, i) => (
            <section key={i} className="rounded-lg border border-zinc-900 bg-black/40 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: ACCENT }}>
                  {meal.title}
                </h3>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => regenerateMeal(i)}
                    disabled={regenIdx !== null}
                    className="rounded-md border border-zinc-800 bg-transparent px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                  >
                    {regenIdx === i ? 'Regenerating…' : 'Swap'}
                  </button>
                  <button
                    onClick={() => deleteMeal(i)}
                    disabled={regenIdx !== null}
                    aria-label={`Remove ${meal.title}`}
                    className="rounded-md border border-zinc-800 bg-transparent px-2 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 hover:bg-zinc-900 hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <Markdown content={meal.body} accent={ACCENT} />
            </section>
          ))}
        </div>
      )}

      {!plan && !loading && (
        <p className="text-sm text-zinc-500">Click &quot;Generate&quot; to get your AI-tailored meal prep.</p>
      )}

      {plan && !loading && parsed.meals.length > 0 && (
        <div className="mt-6 pt-5 border-t border-zinc-900">
          {!listOpen ? (
            <button
              onClick={loadShoppingList}
              className="rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              Show shopping list
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: ACCENT }}>
                  Shopping List
                </p>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={downloadShoppingList}
                    disabled={!shoppingList || listLoading}
                    className="rounded-md bg-emerald-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setListOpen(false)}
                    className="rounded-md border border-zinc-800 bg-transparent px-2.5 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors"
                  >
                    Hide
                  </button>
                </div>
              </div>
              {listLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-3 bg-zinc-900 rounded animate-pulse" style={{ width: `${50 + i * 7}%` }} />
                  ))}
                </div>
              ) : (
                shoppingList && <Markdown content={shoppingList} accent={ACCENT} />
              )}
            </div>
          )}
        </div>
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
