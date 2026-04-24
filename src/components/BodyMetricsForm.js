'use client'

import { useActionState, useEffect, useRef } from 'react'
import { saveBodyMetrics } from '@/app/actions/metrics'
import { useToast } from './ToastProvider'

const initialState = { error: null, success: false }

async function formAction(prevState, formData) {
  try {
    await saveBodyMetrics(formData)
    return { error: null, success: true }
  } catch (e) {
    return { error: e.message, success: false }
  }
}

export default function BodyMetricsForm({ latest }) {
  const [state, action, pending] = useActionState(formAction, initialState)
  const toast = useToast()
  const lastSeen = useRef(state)

  useEffect(() => {
    if (state === lastSeen.current) return
    lastSeen.current = state
    if (state.error) toast.error(state.error)
    else if (state.success) toast.success('Metrics saved!')
  }, [state, toast])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="font-semibold text-zinc-200 mb-1">Log Body Metrics</h3>
      <p className="text-sm text-zinc-500 mb-4">
        Enter your latest Renpho readings
      </p>

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Weight (kg)
            </label>
            <input
              name="weight_kg"
              type="number"
              step="0.1"
              defaultValue={latest?.weight_kg ?? ''}
              placeholder="e.g. 82.5"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Body Fat (%)
            </label>
            <input
              name="body_fat_pct"
              type="number"
              step="0.1"
              defaultValue={latest?.body_fat_pct ?? ''}
              placeholder="e.g. 18.2"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Muscle Mass (kg)
            </label>
            <input
              name="muscle_mass_kg"
              type="number"
              step="0.1"
              defaultValue={latest?.muscle_mass_kg ?? ''}
              placeholder="e.g. 38.1"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : 'Save metrics'}
        </button>
      </form>
    </div>
  )
}
