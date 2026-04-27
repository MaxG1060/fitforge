'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setGoal } from '@/app/actions/onboarding'
import { useToast } from './ToastProvider'
import GoalPicker from './GoalPicker'
import { getGoal } from '@/lib/goals'

export default function GoalCard({ initialGoalId }) {
  const router = useRouter()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(initialGoalId)
  const [goalId, setGoalId] = useState(initialGoalId)
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
      setEditing(false)
      toast.success('Goal updated.')
      router.refresh()
    })
  }

  function cancel() {
    setPending(goalId)
    setEditing(false)
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Goal</p>
          <h3 className="mt-1 text-xl font-black tracking-tight">{goal.label}</h3>
          <p className="mt-1 text-sm text-zinc-500">{goal.desc}</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-md border border-zinc-800 bg-transparent px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            Change
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-5">
          <GoalPicker value={pending} onChange={setPending} disabled={isPending} />
          <div className="mt-4 flex items-center justify-end gap-2">
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
      )}
    </div>
  )
}
