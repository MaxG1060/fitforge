'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, logStartingWeight, setGoal, setMealSettings } from '@/app/actions/onboarding'
import { useToast } from '@/components/ToastProvider'
import GoalPicker from '@/components/GoalPicker'
import { DEFAULT_GOAL_ID } from '@/lib/goals'
import { MEAL_GOALS, DIETARY_RESTRICTIONS, DEFAULT_MEAL_GOAL_ID } from '@/lib/diet'

export default function OnboardingWizard({
  firstname,
  initialGoal,
  initialMealGoal,
  initialRestrictions,
  stravaConnected,
  whoopConnected,
  hasBodyMetric,
}) {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [goal, setGoalState] = useState(initialGoal ?? DEFAULT_GOAL_ID)
  const [mealGoal, setMealGoal] = useState(initialMealGoal ?? DEFAULT_MEAL_GOAL_ID)
  const [restrictions, setRestrictions] = useState(initialRestrictions ?? [])
  const [weight, setWeight] = useState('')
  const [busy, setBusy] = useState(false)
  const [bodyDone, setBodyDone] = useState(hasBodyMetric)

  async function finish() {
    setBusy(true)
    await completeOnboarding()
    router.replace('/dashboard')
  }

  async function saveGoalAndContinue() {
    setBusy(true)
    const res = await setGoal(goal)
    setBusy(false)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    setStep(2)
  }

  async function saveMealAndContinue() {
    setBusy(true)
    const res = await setMealSettings({ mealGoal, restrictions })
    setBusy(false)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    setStep(3)
  }

  function toggleRestriction(id) {
    setRestrictions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function saveWeight(e) {
    e.preventDefault()
    if (!weight) return
    setBusy(true)
    const fd = new FormData()
    fd.append('weight', weight)
    const res = await logStartingWeight(fd)
    setBusy(false)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    setBodyDone(true)
    toast.success('Logged.')
    setStep(5)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-[0.2em] uppercase text-orange-500">FitForge</h1>
        <button
          onClick={finish}
          disabled={busy}
          className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 hover:text-white disabled:opacity-50"
        >
          Skip
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <Stepper step={step} total={6} />

          {step === 0 && (
            <div className="mt-8 text-center">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">Welcome</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">
                Hey{firstname ? `, ${firstname}` : ''}.
              </h2>
              <p className="mt-4 text-zinc-400">
                FitForge pulls your training, recovery, and body data into one place — and turns it into a weekly plan that actually fits your life.
              </p>
              <p className="mt-3 text-zinc-500 text-sm">Let&apos;s set you up in five quick steps.</p>
              <button
                onClick={() => setStep(1)}
                className="mt-8 w-full rounded-md bg-orange-500 px-4 py-3 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors"
              >
                Get started
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="mt-8">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">Step 1 of 5</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">What&apos;s your training goal?</h2>
              <p className="mt-3 text-zinc-400">
                We&apos;ll tune your weekly plan around this. You can change it any time in Settings.
              </p>

              <div className="mt-6">
                <GoalPicker value={goal} onChange={setGoalState} disabled={busy} />
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(0)}
                  disabled={busy}
                  className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 hover:text-white disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  onClick={saveGoalAndContinue}
                  disabled={busy}
                  className="rounded-md bg-orange-500 px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
                >
                  {busy ? 'Saving…' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">Step 2 of 5</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">How should we plan your meals?</h2>
              <p className="mt-3 text-zinc-400">
                Pick a meal goal and any dietary restrictions. Your weekly meal prep adapts to it.
              </p>

              <div className="mt-6">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Meal goal</p>
                <div className="grid grid-cols-1 gap-2">
                  {MEAL_GOALS.map((g) => {
                    const active = mealGoal === g.id
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setMealGoal(g.id)}
                        disabled={busy}
                        className={`text-left rounded-lg border p-3 transition-colors disabled:opacity-50 ${
                          active
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <p className="text-sm font-black tracking-tight">{g.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{g.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">
                  Dietary restrictions <span className="text-zinc-600">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_RESTRICTIONS.map((r) => {
                    const active = restrictions.includes(r.id)
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRestriction(r.id)}
                        disabled={busy}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors disabled:opacity-50 ${
                          active
                            ? 'bg-emerald-500 text-black'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={busy}
                  className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 hover:text-white disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  onClick={saveMealAndContinue}
                  disabled={busy}
                  className="rounded-md bg-orange-500 px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
                >
                  {busy ? 'Saving…' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <SetupStep
              eyebrow="Step 3 of 5"
              title="Connect Strava"
              desc="We auto-import your runs, rides, and workouts so you don't have to log them by hand."
              done={stravaConnected}
              connectHref="/api/strava/connect"
              onSkip={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && (
            <SetupStep
              eyebrow="Step 4 of 5"
              title="Connect WHOOP"
              desc="Pull recovery, sleep, and strain into your dashboard. Your weekly training plan adapts to it."
              done={whoopConnected}
              connectHref="/api/whoop/connect"
              onSkip={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}

          {step === 5 && (
            <div className="mt-8">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">Step 5 of 5</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Log your starting weight</h2>
              <p className="mt-3 text-zinc-400">
                Even one number gives us a baseline. You can update it any time from the dashboard.
              </p>

              {bodyDone ? (
                <div className="mt-6 rounded-md border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                  Weight already on file. You&apos;re good to go.
                </div>
              ) : (
                <form onSubmit={saveWeight} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="400"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                      autoFocus
                      placeholder="e.g. 78.5"
                      className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !weight}
                    className="w-full rounded-md bg-orange-500 px-4 py-3 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
                  >
                    {busy ? 'Saving…' : 'Log it'}
                  </button>
                </form>
              )}

              <div className="mt-4 flex items-center justify-between text-[10px] font-bold tracking-[0.15em] uppercase">
                <button onClick={() => setStep(4)} className="text-zinc-500 hover:text-white">
                  ← Back
                </button>
                <button onClick={finish} disabled={busy} className="text-zinc-400 hover:text-white disabled:opacity-50">
                  {bodyDone ? 'Finish →' : 'Skip for now →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Stepper({ step, total }) {
  return (
    <div className="flex items-center gap-2">
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= step ? 'bg-orange-500' : 'bg-zinc-900'
          }`}
        />
      ))}
    </div>
  )
}

function SetupStep({ eyebrow, title, desc, done, connectHref, onSkip, onBack }) {
  return (
    <div className="mt-8">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight">{title}</h2>
      <p className="mt-3 text-zinc-400">{desc}</p>

      {done ? (
        <div className="mt-6 rounded-md border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          Already connected. Nice.
        </div>
      ) : (
        <a
          href={connectHref}
          className="mt-6 block w-full rounded-md bg-orange-500 px-4 py-3 text-center text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors"
        >
          Connect
        </a>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] font-bold tracking-[0.15em] uppercase">
        <button onClick={onBack} className="text-zinc-500 hover:text-white">
          ← Back
        </button>
        <button onClick={onSkip} className="text-zinc-400 hover:text-white">
          {done ? 'Continue →' : 'Skip for now →'}
        </button>
      </div>
    </div>
  )
}
