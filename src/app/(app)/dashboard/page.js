import { createClient } from '@/lib/supabase/server'
import BodyMetricsForm from '@/components/BodyMetricsForm'
import BodyMetricsChart from '@/components/BodyMetricsChart'
import StravaWorkouts from '@/components/StravaWorkouts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: metricsHistory } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(90)

  const history = metricsHistory ?? []
  const m = history[0]

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
    <>
      <div>
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="mt-1 text-zinc-400">Here&apos;s your fitness overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Weight" value={m?.weight_kg ?? '—'} unit="kg" />
        <StatCard label="Body Fat" value={m?.body_fat_pct ?? '—'} unit="%" />
        <StatCard label="Muscle Mass" value={m?.muscle_mass_kg ?? '—'} unit="kg" />
      </div>

      <BodyMetricsChart history={history} />
      <BodyMetricsForm latest={m} />
      <StravaWorkouts connected={!!stravaToken} workouts={workouts ?? []} />
    </>
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
