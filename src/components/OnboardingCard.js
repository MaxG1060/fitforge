'use client'

import { useState, useEffect } from 'react'

const DISMISS_KEY = 'fitforge_onboarding_dismissed'

export default function OnboardingCard({ stravaConnected, whoopConnected, hasBodyMetric, firstname }) {
  const [dismissed, setDismissed] = useState(true) // start hidden until we read storage

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  const steps = [
    {
      key: 'strava',
      done: stravaConnected,
      title: 'Connect Strava',
      desc: 'Auto-import your runs, rides, and workouts.',
      cta: 'Connect',
      href: '/api/strava/connect',
    },
    {
      key: 'whoop',
      done: whoopConnected,
      title: 'Connect WHOOP',
      desc: 'Pull recovery, sleep, and strain into your dashboard.',
      cta: 'Connect',
      href: '/api/whoop/connect',
    },
    {
      key: 'body',
      done: hasBodyMetric,
      title: 'Log your starting weight',
      desc: 'Even just one number lets us track your trend.',
      cta: 'Log it',
      href: '#body-metrics-form',
    },
  ]

  const remaining = steps.filter((s) => !s.done).length
  if (remaining === 0 || dismissed) return null

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-zinc-950 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">Get started</p>
          <h3 className="mt-1 text-xl font-black tracking-tight">
            {firstname ? `Welcome, ${firstname}.` : 'Welcome to FitForge.'}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {remaining} step{remaining > 1 ? 's' : ''} left to set up your dashboard.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 hover:text-white shrink-0"
        >
          Dismiss
        </button>
      </div>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${
              s.done
                ? 'border-emerald-900/50 bg-emerald-950/20'
                : 'border-zinc-800 bg-black/40'
            }`}
          >
            <div
              className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                s.done ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-700'
              }`}
            >
              {s.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${s.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                {s.title}
              </p>
              {!s.done && <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>}
            </div>
            {!s.done && (
              <a
                href={s.href}
                className="rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors shrink-0"
              >
                {s.cta}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
