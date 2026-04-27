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
    <div id="body-metrics-form" className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 scroll-mt-20">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">Log Metrics</p>
      <h3 className="text-xl font-black tracking-tight mb-1">Body</h3>
      <p className="text-sm text-zinc-500 mb-4">
        Enter your latest Renpho readings
      </p>

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-1.5">
              Weight (kg)
            </label>
            <input
              name="weight_kg"
              type="number"
              step="0.1"
              placeholder={latest?.weight_kg != null ? `last: ${latest.weight_kg}` : 'e.g. 82.5'}
              className="w-full rounded-md bg-black border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-1.5">
              Body Fat (%)
            </label>
            <input
              name="body_fat_pct"
              type="number"
              step="0.1"
              placeholder={latest?.body_fat_pct != null ? `last: ${latest.body_fat_pct}` : 'e.g. 18.2'}
              className="w-full rounded-md bg-black border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-1.5">
              Muscle Mass (kg)
            </label>
            <input
              name="muscle_mass_kg"
              type="number"
              step="0.1"
              placeholder={latest?.muscle_mass_kg != null ? `last: ${latest.muscle_mass_kg}` : 'e.g. 38.1'}
              className="w-full rounded-md bg-black border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
