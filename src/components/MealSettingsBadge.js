'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setMealSettings } from '@/app/actions/onboarding'
import { useToast } from './ToastProvider'
import { MEAL_GOALS, DIETARY_RESTRICTIONS, getMealGoal } from '@/lib/diet'

export default function MealSettingsBadge({ initialMealGoal, initialRestrictions }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [mealGoalId, setMealGoalId] = useState(initialMealGoal)
  const [restrictionIds, setRestrictionIds] = useState(initialRestrictions ?? [])
  const [pendingGoal, setPendingGoal] = useState(initialMealGoal)
  const [pendingRestrictions, setPendingRestrictions] = useState(initialRestrictions ?? [])
  const [isPending, startTransition] = useTransition()

  const goal = getMealGoal(mealGoalId)
  const restrictionLabels = DIETARY_RESTRICTIONS
    .filter((r) => restrictionIds.includes(r.id))
    .map((r) => r.label)

  function openModal() {
    setPendingGoal(mealGoalId)
    setPendingRestrictions(restrictionIds)
    setOpen(true)
  }

  function toggleRestriction(id) {
    setPendingRestrictions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function save() {
    startTransition(async () => {
      const res = await setMealSettings({
        mealGoal: pendingGoal,
        restrictions: pendingRestrictions,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setMealGoalId(pendingGoal)
      setRestrictionIds(pendingRestrictions)
      setOpen(false)
      toast.success('Meal settings updated.')
      router.refresh()
    })
  }

  function cancel() {
    setOpen(false)
  }

  const dirty =
    pendingGoal !== mealGoalId ||
    pendingRestrictions.length !== restrictionIds.length ||
    pendingRestrictions.some((id) => !restrictionIds.includes(id))

  return (
    <>
      <button
        onClick={openModal}
        className="group inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 pl-4 pr-3 py-2 hover:border-zinc-700 hover:bg-zinc-900 transition-colors text-left shrink-0"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500">Diet</span>
          <span className="text-sm font-bold text-white truncate">
            {goal.label}
            {restrictionLabels.length > 0 && (
              <span className="text-zinc-500 font-normal"> · {restrictionLabels.join(', ')}</span>
            )}
          </span>
        </span>
        <span className="hidden group-hover:inline text-[9px] font-bold tracking-[0.15em] uppercase text-white transition-colors">
          Change
        </span>
      </button>

      {open && (
        <div
          onClick={cancel}
          className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 max-h-[90vh] overflow-y-auto"
          >
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Meal settings</p>
            <h3 className="mt-1 text-xl font-black tracking-tight">Tune your plan</h3>
            <p className="mt-1 text-sm text-zinc-500">Your weekly meal prep adapts to these.</p>

            <div className="mt-5">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Goal</p>
              <div className="grid grid-cols-1 gap-2">
                {MEAL_GOALS.map((g) => {
                  const active = pendingGoal === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setPendingGoal(g.id)}
                      disabled={isPending}
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
                Dietary restrictions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_RESTRICTIONS.map((r) => {
                  const active = pendingRestrictions.includes(r.id)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRestriction(r.id)}
                      disabled={isPending}
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

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={cancel}
                disabled={isPending}
                className="rounded-md border border-zinc-800 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isPending || !dirty}
                className="rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
