import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BodyMetricsForm from '@/components/BodyMetricsForm'
import MealPlan from '@/components/MealPlan'
import TrainingPlan from '@/components/TrainingPlan'
import StravaWorkouts from '@/components/StravaWorkouts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: latestMetrics } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const m = latestMetrics

  const { data: stravaToken } = await supabase
    .from('strava_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10)

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
          <StatCard label="Weight" value={m?.weight_kg ?? '—'} unit="kg" />
          <StatCard label="Body Fat" value={m?.body_fat_pct ?? '—'} unit="%" />
          <StatCard label="Muscle Mass" value={m?.muscle_mass_kg ?? '—'} unit="kg" />
        </div>

        <BodyMetricsForm latest={m} />

        <StravaWorkouts connected={!!stravaToken} workouts={workouts ?? []} />

        <TrainingPlan />
        <MealPlan />
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
