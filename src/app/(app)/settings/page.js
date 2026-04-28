import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import { getGoal } from '@/lib/goals'
import { DEFAULT_MEAL_GOAL_ID } from '@/lib/diet'
import PublicProfileCard from '@/components/PublicProfileCard'
import PushNotificationsCard from '@/components/PushNotificationsCard'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: stravaToken }, { data: whoopToken }, { data: ouraToken }, { data: profile }] = await Promise.all([
    supabase.from('strava_tokens').select('athlete_id, firstname').eq('user_id', user.id).maybeSingle(),
    supabase.from('whoop_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('oura_tokens').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('username, display_name, is_public').eq('user_id', user.id).maybeSingle(),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const goal = getGoal(user.user_metadata?.goal)
  const mealGoalId = user.user_metadata?.meal_goal ?? DEFAULT_MEAL_GOAL_ID
  const restrictionIds = user.user_metadata?.dietary_restrictions ?? []

  return (
    <>
      <SettingsClient
        email={user.email}
        createdAt={user.created_at}
        onboardedAt={user.user_metadata?.onboarded_at ?? null}
        strava={stravaToken}
        whoopConnected={!!whoopToken}
        ouraConnected={!!ouraToken}
        goalId={goal.id}
        mealGoalId={mealGoalId}
        restrictionIds={restrictionIds}
      />
      <PublicProfileCard
        initialUsername={profile?.username ?? ''}
        initialDisplayName={profile?.display_name ?? ''}
        initialIsPublic={profile?.is_public ?? false}
        appUrl={appUrl}
      />
      <PushNotificationsCard vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''} />
    </>
  )
}
