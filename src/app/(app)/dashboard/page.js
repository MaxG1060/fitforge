import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BodyMetricsForm from '@/components/BodyMetricsForm'
import TrendChart from '@/components/TrendChart'
import StravaWorkouts from '@/components/StravaWorkouts'
import WhoopWidget from '@/components/WhoopWidget'
import OnboardingCard from '@/components/OnboardingCard'
import { getValidAccessToken, fetchAthlete } from '@/lib/strava'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user.user_metadata?.onboarded_at) {
    const [{ data: s }, { data: w }, { data: b }] = await Promise.all([
      supabase.from('strava_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('whoop_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('body_metrics').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    ])
    if (!s && !w && !b) redirect('/onboarding')
  }

  const { data: metricsHistory } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(90)

  const history = metricsHistory ?? []
  const m = history[0]
  const latestWeight = history.find((r) => r.weight_kg != null)?.weight_kg
  const latestBodyFat = history.find((r) => r.body_fat_pct != null)?.body_fat_pct
  const latestMuscle = history.find((r) => r.muscle_mass_kg != null)?.muscle_mass_kg

  const { data: stravaToken } = await supabase
    .from('strava_tokens')
    .select('user_id, firstname, profile_url')
    .eq('user_id', user.id)
    .maybeSingle()

  let firstname = stravaToken?.firstname ?? null
  if (stravaToken && (!firstname || !stravaToken.profile_url)) {
    try {
      const accessToken = await getValidAccessToken(supabase, user.id)
      if (accessToken) {
        const athlete = await fetchAthlete(accessToken)
        firstname = athlete?.firstname ?? firstname
        const profile_url = athlete?.profile_medium ?? athlete?.profile ?? null
        const updates = {}
        if (firstname && !stravaToken.firstname) updates.firstname = firstname
        if (profile_url && !stravaToken.profile_url) updates.profile_url = profile_url
        if (Object.keys(updates).length) {
          await supabase.from('strava_tokens').update(updates).eq('user_id', user.id)
        }
      }
    } catch {}
  }

  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  const { data: whoopToken } = await supabase
    .from('whoop_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const [recoveryHist, sleepHist, cycleHist] = await Promise.all([
    supabase.from('whoop_recovery').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
    supabase.from('whoop_sleep').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
    supabase.from('whoop_cycle').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
  ])

  const recoveryRows = recoveryHist.data ?? []
  const sleepRows = sleepHist.data ?? []
  const cycleRows = cycleHist.data ?? []

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Today</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">
          Welcome back{firstname ? `, ${firstname}` : ''}
        </h2>
      </div>

      <OnboardingCard
        stravaConnected={!!stravaToken}
        whoopConnected={!!whoopToken}
        hasBodyMetric={history.length > 0}
        firstname={firstname}
      />

      <WhoopWidget
        connected={!!whoopToken}
        recovery={recoveryRows[0]}
        sleep={sleepRows[0]}
        cycle={cycleRows[0]}
      />

      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">Body</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Weight" value={latestWeight ?? '—'} unit="kg" />
          <StatCard label="Body Fat" value={latestBodyFat ?? '—'} unit="%" />
          <StatCard label="Muscle Mass" value={latestMuscle ?? '—'} unit="kg" />
        </div>
      </div>

      <TrendChart
        body={history}
        recovery={recoveryRows}
        sleep={sleepRows}
        cycle={cycleRows}
      />
      <BodyMetricsForm latest={m} />
      <StravaWorkouts connected={!!stravaToken} workouts={workouts ?? []} />
    </>
  )
}

function StatCard({ label, value, unit }) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-5">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight">
        {value}
        <span className="ml-1 text-base font-medium text-zinc-500">{unit}</span>
      </p>
    </div>
  )
}
