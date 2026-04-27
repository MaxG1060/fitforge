'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setGoal } from '@/app/actions/onboarding'
import { useToast } from './ToastProvider'
import GoalPicker from './GoalPicker'
import { getGoal } from '@/lib/goals'

export default function GoalBadge({ initialGoalId }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [goalId, setGoalId] = useState(initialGoalId)
  const [pending, setPending] = useState(initialGoalId)
  const [isPending, startTransition] = useTransition()

  const goal = getGoal(goalId)

  function save() {
    startTransition(async () => {
      const res = await setGoal(pending)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setGoalId(pending)
      setOpen(false)
      toast.success('Goal updated.')
      router.refresh()
    })
  }

  function cancel() {
    setPending(goalId)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 pl-4 pr-3 py-2 hover:border-zinc-700 hover:bg-zinc-900 transition-colors text-left shrink-0"
      >
        <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-500">Goal</span>
          <span className="text-sm font-bold text-white truncate">{goal.label}</span>
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
            className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6"
          >
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Goal</p>
            <h3 className="mt-1 text-xl font-black tracking-tight">Pick your goal</h3>
            <p className="mt-1 text-sm text-zinc-500">Your weekly plan adapts to it.</p>

            <div className="mt-5">
              <GoalPicker value={pending} onChange={setPending} disabled={isPending} />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={cancel}
                disabled={isPending}
                className="rounded-md border border-zinc-800 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isPending || pending === goalId}
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
