import { createClient } from '@/lib/supabase/server'
import TrainingPlan from '@/components/TrainingPlan'
import GoalBadge from '@/components/GoalBadge'
import { getGoal } from '@/lib/goals'
import { computeStreak, todayISO, isoDate, weekStartMonday } from '@/lib/week'

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: latest } = await supabase
    .from('plans')
    .select('content, created_at')
    .eq('user_id', user.id)
    .eq('kind', 'training')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: recoveryToday }, { data: ouraToday }] = await Promise.all([
    supabase
      .from('whoop_recovery')
      .select('score, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('oura_readiness')
      .select('score, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const whoopToday =
    recoveryToday && recoveryToday.date === today ? recoveryToday.score : null
  const ouraScore =
    ouraToday && ouraToday.date === today ? ouraToday.score : null
  const todayRecovery = whoopToday ?? ouraScore

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const { data: completions } = await supabase
    .from('workout_completions')
    .select('date')
    .eq('user_id', user.id)
    .gte('date', isoDate(sixtyDaysAgo))
    .order('date', { ascending: false })

  const completionDates = (completions ?? []).map((r) => r.date)
  const streak = computeStreak(completionDates)
  const completedSet = completionDates

  const isMonday = new Date().getDay() === 1
  const monday = weekStartMonday()
  const planFromPriorWeek =
    !!latest?.created_at && new Date(latest.created_at) < monday
  const showAutoReplan = isMonday && planFromPriorWeek

  const goal = getGoal(user.user_metadata?.goal)

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_public')
    .eq('user_id', user.id)
    .maybeSingle()
  const shareUsername = profile?.is_public ? profile.username : null
  const shareBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">This Week</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Training Plan</h2>
          <p className="mt-2 text-sm text-zinc-500">Generated weekly, tailored to your sport mix and recent activity.</p>
        </div>
        <GoalBadge initialGoalId={goal.id} />
      </div>
      <TrainingPlan
        savedPlan={latest?.content}
        savedAt={latest?.created_at}
        goalLabel={goal.label}
        todayRecovery={todayRecovery}
        completedDates={completedSet}
        streak={streak}
        showAutoReplan={showAutoReplan}
        shareUsername={shareUsername}
        shareBaseUrl={shareBaseUrl}
      />
    </>
  )
}
