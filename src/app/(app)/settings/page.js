import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import { getGoal } from '@/lib/goals'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: stravaToken }, { data: whoopToken }] = await Promise.all([
    supabase.from('strava_tokens').select('athlete_id, firstname').eq('user_id', user.id).maybeSingle(),
    supabase.from('whoop_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
  ])

  const goal = getGoal(user.user_metadata?.goal)

  return (
    <SettingsClient
      email={user.email}
      createdAt={user.created_at}
      onboardedAt={user.user_metadata?.onboarded_at ?? null}
      strava={stravaToken}
      whoopConnected={!!whoopToken}
      goalId={goal.id}
    />
  )
}
