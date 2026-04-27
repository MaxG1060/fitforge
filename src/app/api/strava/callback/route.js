import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForToken } from '@/lib/strava'
import { redirect } from 'next/navigation'

function derivePassword(athleteId) {
  const secret = process.env.STRAVA_AUTH_SECRET
  if (!secret) throw new Error('STRAVA_AUTH_SECRET not set')
  return crypto.createHmac('sha256', secret).update(String(athleteId)).digest('hex')
}

function syntheticEmail(athleteId) {
  return `strava-${athleteId}@fitforge.local`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  if (error || !code) {
    redirect((state === 'login' ? '/login' : '/dashboard') + '?strava_error=' + (error || 'no_code'))
  }

  const tokenData = await exchangeCodeForToken(code)
  const athleteId = tokenData.athlete?.id
  if (!athleteId) redirect('/login?strava_error=no_athlete')

  const supabase = await createClient()

  if (state === 'login') {
    const admin = createAdminClient()
    const email = syntheticEmail(athleteId)
    const password = derivePassword(athleteId)

    let { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })

    if (signInErr) {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          strava_athlete_id: athleteId,
          firstname: tokenData.athlete?.firstname ?? null,
        },
      })

      if (createErr && !/already.*registered|exists/i.test(createErr.message)) {
        redirect('/login?strava_error=' + encodeURIComponent(createErr.message))
      }

      if (createErr) {
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
        const existing = list?.users?.find((u) => u.email === email)
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, { password })
        }
      }

      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (retry.error) redirect('/login?strava_error=' + encodeURIComponent(retry.error.message))
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?strava_error=no_session')

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
