import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken, fetchRecentActivities } from '@/lib/strava'
import { revalidatePath } from 'next/cache'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const accessToken = await getValidAccessToken(supabase, user.id)
  if (!accessToken) return Response.json({ error: 'Strava not connected' }, { status: 400 })

  const activities = await fetchRecentActivities(accessToken, 30)

  const rows = activities.map((a) => ({
    user_id: user.id,
    strava_id: a.id,
    name: a.name,
    sport_type: a.sport_type ?? a.type,
    distance_m: a.distance,
    moving_time_s: a.moving_time,
    total_elevation_gain_m: a.total_elevation_gain,
    started_at: a.start_date,
    average_heartrate: a.average_heartrate,
    max_heartrate: a.max_heartrate,
  }))

  if (rows.length > 0) {
    await supabase.from('workouts').upsert(rows, { onConflict: 'strava_id' })
  }

  revalidatePath('/dashboard')
  return Response.json({ synced: rows.length })
}
