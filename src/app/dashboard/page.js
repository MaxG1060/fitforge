import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-500">FitForge</h1>
        <span className="text-sm text-zinc-400">{user.email}</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-1 text-zinc-400">Here&apos;s your fitness overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Weight" value="—" unit="kg" />
          <StatCard label="Body Fat" value="—" unit="%" />
          <StatCard label="Muscle Mass" value="—" unit="kg" />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold text-zinc-200 mb-2">Recent Workouts</h3>
          <p className="text-sm text-zinc-500">No workouts logged yet. Strava sync coming soon.</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold text-zinc-200 mb-2">This Week&apos;s Plan</h3>
          <p className="text-sm text-zinc-500">AI training plan coming soon.</p>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, unit }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold">
        {value}
        <span className="ml-1 text-base font-normal text-zinc-400">{unit}</span>
      </p>
    </div>
  )
}
