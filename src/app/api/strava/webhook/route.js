import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken, fetchActivity } from '@/lib/strava'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return Response.json({ 'hub.challenge': challenge })
  }
  return Response.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request) {
  const event = await request.json()

  // Strava requires 200 within 2s — process async, don't await
  handleEvent(event).catch((err) => console.error('Webhook handling failed:', err))

  return Response.json({ ok: true })
}

async function handleEvent(event) {
  const { object_type, object_id, aspect_type, owner_id } = event
  if (object_type !== 'activity') return

  const supabase = createAdminClient()

  const { data: tokenRow } = await supabase
    .from('strava_tokens')
    .select('user_id')
    .eq('athlete_id', owner_id)
    .maybeSingle()

  if (!tokenRow) {
    console.warn(`No user found for Strava athlete ${owner_id}`)
    return
  }

  const userId = tokenRow.user_id

  if (aspect_type === 'delete') {
    await supabase.from('workouts').delete().eq('strava_id', object_id).eq('user_id', userId)
    return
  }

  const accessToken = await getValidAccessToken(supabase, userId)
  if (!accessToken) return

  const a = await fetchActivity(accessToken, object_id)

  await supabase.from('workouts').upsert(
    {
      user_id: userId,
      strava_id: a.id,
      name: a.name,
      sport_type: a.sport_type ?? a.type,
      distance_m: a.distance,
      moving_time_s: a.moving_time,
      total_elevation_gain_m: a.total_elevation_gain,
      started_at: a.start_date,
      average_heartrate: a.average_heartrate,
      max_heartrate: a.max_heartrate,
    },
    { onConflict: 'strava_id' }
  )
}
