import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken, fetchProfile } from '@/lib/whoop'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) redirect('/dashboard?whoop=error')

  const tokens = await exchangeCodeForToken(code)
  let whoopUserId = null
  try {
    const profile = await fetchProfile(tokens.access_token)
    whoopUserId = profile.user_id ?? null
  } catch {}

  await supabase.from('whoop_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    whoop_user_id: whoopUserId,
    updated_at: new Date().toISOString(),
  })

  redirect('/dashboard?whoop=connected')
}
