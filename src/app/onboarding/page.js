import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'
import { DEFAULT_MEAL_GOAL_ID } from '@/lib/diet'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: stravaToken }, { data: whoopToken }, { data: bodyMetric }] = await Promise.all([
    supabase.from('strava_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('whoop_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('body_metrics').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
  ])

  const firstname = user.user_metadata?.firstname ?? null
  const goal = user.user_metadata?.goal ?? null
  const mealGoal = user.user_metadata?.meal_goal ?? DEFAULT_MEAL_GOAL_ID
  const restrictions = user.user_metadata?.dietary_restrictions ?? []

  return (
    <OnboardingWizard
      firstname={firstname}
      initialGoal={goal}
      initialMealGoal={mealGoal}
      initialRestrictions={restrictions}
      stravaConnected={!!stravaToken}
      whoopConnected={!!whoopToken}
      hasBodyMetric={!!bodyMetric}
    />
  )
}
