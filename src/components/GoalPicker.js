'use client'

import { GOALS } from '@/lib/goals'

export default function GoalPicker({ value, onChange, disabled }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {GOALS.map((g) => {
        const active = value === g.id
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            disabled={disabled}
            className={`text-left rounded-lg border p-4 transition-colors disabled:opacity-50 ${
              active
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
            }`}
          >
            <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${active ? 'text-orange-500' : 'text-zinc-500'}`}>
              {active ? 'Selected' : 'Goal'}
            </p>
            <p className="mt-1.5 text-base font-black tracking-tight">{g.label}</p>
            <p className="mt-1 text-xs text-zinc-400">{g.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
