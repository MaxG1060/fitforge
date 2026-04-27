import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken } from '@/lib/strava'
import { redirect } from 'next/navigation'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    redirect('/dashboard?strava_error=' + (error || 'no_code'))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tokenData = await exchangeCodeForToken(code)
  const athleteId = tokenData.athlete?.id
  if (!athleteId) redirect('/dashboard?strava_error=no_athlete')

  await supabase.from('strava_tokens').upsert({
    user_id: user.id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: tokenData.expires_at,
    athlete_id: athleteId,
    firstname: tokenData.athlete?.firstname ?? null,
    profile_url: tokenData.athlete?.profile_medium ?? tokenData.athlete?.profile ?? null,
    updated_at: new Date().toISOString(),
  })

  redirect('/dashboard?strava=connected')
}
