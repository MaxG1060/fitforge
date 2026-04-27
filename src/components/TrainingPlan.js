'use client'

import { useState } from 'react'
import { useToast } from './ToastProvider'
import Markdown from './Markdown'
import SportIcon, { pickIconType } from './SportIcon'
import { lookupExercise, youtubeSearchUrl } from '@/lib/exercises'

const SPORTS = ['Gym', 'Running', 'Road cycling', 'Yoga', 'Pilates', 'Padel', 'Boxing', 'Swimming', 'HIIT', 'Hiking', 'Rowing']
const SWAP_SPORTS = [...SPORTS, 'Rest']
const DEFAULT_SPORTS = ['Gym', 'Running']

function isFocusTitle(title) {
  return /weekly\s*focus|focus\s*for\s*the\s*week|week(?:ly)?\s*overview/i.test(title)
}

function extractTrailingFocus(body) {
  if (!body) return { body, focus: null }
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].replace(/\*\*/g, '').replace(/^#+\s*/, '').trim()
    if (isFocusTitle(stripped)) {
      const before = lines.slice(0, i).join('\n').trim()
      const after = lines.slice(i + 1).join('\n').trim()
      return { body: before, focus: after }
    }
  }
  return { body, focus: null }
}

function joinDays({ intro, focus, days }) {
  const parts = []
  if (focus) {
    parts.push('## Weekly focus')
    parts.push(focus)
    parts.push('')
  }
  if (intro) parts.push(intro, '')
  for (const d of days) {
    parts.push(`## ${d.title}`)
    if (d.body) parts.push(d.body)
    parts.push('')
  }
  return parts.join('\n').trim()
}

function splitDays(plan) {
  if (!plan) return { intro: '', focus: null, days: [] }
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

  let focus = null
  const focusIdx = days.findIndex((d) => isFocusTitle(d.title))
  if (focusIdx >= 0) {
    focus = days[focusIdx].bodyLines.join('\n').trim()
    days.splice(focusIdx, 1)
  }

  const mapped = days.map((d) => ({ title: d.title, body: d.bodyLines.join('\n').trim() }))

  if (!focus && mapped.length > 0) {
    const last = mapped[mapped.length - 1]
    const split = extractTrailingFocus(last.body)
    if (split.focus) {
      mapped[mapped.length - 1] = { ...last, body: split.body }
      focus = split.focus
    }
  }

  return {
    intro: intro.join('\n').trim(),
    focus,
    days: mapped,
  }
}

export default function TrainingPlan({ savedPlan, savedAt, goalLabel }) {
  const toast = useToast()
  const [plan, setPlan] = useState(savedPlan ?? null)
  const [loading, setLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState(savedAt ?? null)
  const [sports, setSports] = useState(DEFAULT_SPORTS)
  const [swapOpenIdx, setSwapOpenIdx] = useState(null)
  const [swapBusyIdx, setSwapBusyIdx] = useState(null)

  const parsed = splitDays(plan)

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

  async function swapDay(index, sport) {
    const day = parsed.days[index]
    if (!day) return
    setSwapBusyIdx(index)
    try {
      const others = parsed.days.filter((_, i) => i !== index).map((d) => ({ title: d.title }))
      const res = await fetch('/api/training-plan/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayTitle: day.title, sport, otherDays: others }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const newSplit = splitDays(data.day)
      const newDay = newSplit.days[0]
      if (!newDay) throw new Error('Could not parse new day')

      const updated = { ...parsed }
      updated.days = parsed.days.map((d, i) => (i === index ? newDay : d))
      const newPlan = joinDays(updated)
      setPlan(newPlan)
      setSwapOpenIdx(null)

      const save = await fetch('/api/training-plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPlan }),
      })
      const saveData = await save.json()
      if (saveData.error) throw new Error(saveData.error)

      toast.success(`${day.title.split(/[—:-]/)[0].trim()} → ${sport}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSwapBusyIdx(null)
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
        {goalLabel ?? 'Personal goal'} · tailored to your recent Strava activity
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

      {plan && !loading && (
        <div className="space-y-3">
          {parsed.focus && (
            <section className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500 mb-2">Weekly focus</p>
              <Markdown content={parsed.focus} accent="#f97316" />
            </section>
          )}
          {parsed.intro && <Markdown content={parsed.intro} accent="#f97316" />}
          {parsed.days.map((day, i) => {
            const open = swapOpenIdx === i
            const busy = swapBusyIdx === i
            return (
              <section key={i} className="rounded-lg border border-zinc-900 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base font-black tracking-tight text-orange-500 min-w-0 truncate">
                    {day.title}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSwapOpenIdx(open ? null : i)}
                      disabled={swapBusyIdx !== null}
                      className="rounded-md border border-zinc-800 bg-transparent px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                    >
                      {busy ? 'Swapping…' : open ? 'Cancel' : 'Swap'}
                    </button>
                    <SportIcon
                      type={pickIconType(day.title)}
                      size={20}
                      className="text-zinc-400"
                    />
                  </div>
                </div>

                {open && (
                  <div className="mb-3 rounded-md border border-zinc-900 bg-black/60 p-3">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Pick a sport</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SWAP_SPORTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => swapDay(i, s)}
                          disabled={swapBusyIdx !== null}
                          className="rounded-md bg-zinc-900 px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-orange-500 hover:text-black disabled:opacity-50 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <DayBody body={day.body} dayKey={i} />
              </section>
            )
          })}
        </div>
      )}

      {!plan && !loading && (
        <p className="text-sm text-zinc-500">Click &quot;Generate&quot; to get your AI-tailored weekly training.</p>
      )}
    </div>
  )
}

function parseExerciseBullet(line) {
  const stripped = line.replace(/^[-*]\s+/, '')
  const dashSplit = stripped.split(/\s+—\s+|\s+--\s+|\s+-\s+/)
  if (dashSplit.length >= 2) {
    const head = dashSplit[0].trim()
    const cue = dashSplit.slice(1).join(' — ').trim()
    const colonIdx = head.indexOf(':')
    const name = colonIdx >= 0 ? head.slice(0, colonIdx).trim() : head
    const spec = colonIdx >= 0 ? head.slice(colonIdx + 1).trim() : ''
    return { name, spec, cue }
  }
  const colonIdx = stripped.indexOf(':')
  if (colonIdx >= 0) {
    return { name: stripped.slice(0, colonIdx).trim(), spec: stripped.slice(colonIdx + 1).trim(), cue: '' }
  }
  return { name: stripped.trim(), spec: '', cue: '' }
}

function renderInlineMd(text, keyPrefix) {
  const parts = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let i = 0
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) parts.push(<strong key={`${keyPrefix}-${i++}`} className="font-bold text-white">{m[1]}</strong>)
    else if (m[2]) parts.push(<em key={`${keyPrefix}-${i++}`} className="italic text-zinc-300">{m[2]}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function ExerciseRow({ name, spec, cue, rowKey }) {
  const [open, setOpen] = useState(false)
  const dict = lookupExercise(name)
  const hasDetails = !!(cue || dict)

  return (
    <li className="rounded-md">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        disabled={!hasDetails}
        className={`w-full flex items-start gap-2.5 text-left text-sm leading-relaxed py-1 ${
          hasDetails ? 'hover:text-white text-zinc-300 cursor-pointer' : 'text-zinc-300 cursor-default'
        }`}
      >
        <span className="mt-2 h-1 w-1 rounded-full shrink-0 bg-orange-500" />
        <span className="flex-1 min-w-0">
          <span className="font-medium text-white">{name}</span>
          {spec && <span className="text-zinc-300">: {spec}</span>}
        </span>
        {hasDetails && (
          <span className={`mt-1 text-zinc-500 text-xs transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}>
            ›
          </span>
        )}
      </button>

      {open && hasDetails && (
        <div className="ml-3.5 mt-1 mb-2 rounded-md border border-zinc-900 bg-black/40 p-3 text-xs space-y-2">
          {dict?.muscles && (
            <div>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">Targets</span>
              <p className="mt-0.5 text-zinc-300">{dict.muscles}</p>
            </div>
          )}
          {cue && (
            <div>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">Coach&apos;s cue</span>
              <p className="mt-0.5 text-zinc-300 leading-relaxed">{renderInlineMd(cue, `cue-${rowKey}`)}</p>
            </div>
          )}
          {dict?.cue && dict.cue !== cue && (
            <div>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">Form check</span>
              <p className="mt-0.5 text-zinc-300 leading-relaxed">{dict.cue}</p>
            </div>
          )}
          {dict?.sub && (
            <div>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">Easier sub</span>
              <p className="mt-0.5 text-zinc-300">{dict.sub}</p>
            </div>
          )}
          <a
            href={youtubeSearchUrl(name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.15em] uppercase text-orange-500 hover:text-orange-400"
          >
            Watch demo ↗
          </a>
        </div>
      )}
    </li>
  )
}

function DayBody({ body, dayKey }) {
  if (!body) return null
  const lines = body.split('\n')
  const blocks = []
  let bullets = []
  let blockKey = 0

  function flushBullets() {
    if (bullets.length === 0) return
    const items = bullets
    blocks.push(
      <ul key={`ul-${dayKey}-${blockKey++}`} className="space-y-0.5">
        {items.map((b, i) => {
          const parsed = parseExerciseBullet(b)
          return <ExerciseRow key={i} rowKey={`${dayKey}-${blockKey}-${i}`} {...parsed} />
        })}
      </ul>
    )
    bullets = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('- ') || line.startsWith('* ')) {
      bullets.push(line)
      continue
    }
    if (/^-{3,}\s*$/.test(line)) continue
    flushBullets()
    if (line.trim() === '') continue
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={`h-${dayKey}-${blockKey++}`} className="text-sm font-bold text-zinc-100 mt-3 mb-1 tracking-tight">
          {renderInlineMd(line.slice(4).trim(), `h-${dayKey}-${blockKey}`)}
        </h4>
      )
      continue
    }
    blocks.push(
      <p key={`p-${dayKey}-${blockKey++}`} className="text-sm text-zinc-400 leading-relaxed">
        {renderInlineMd(line, `p-${dayKey}-${blockKey}`)}
      </p>
    )
  }
  flushBullets()

  return <div className="space-y-2">{blocks}</div>
}

function formatWhen(iso) {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
