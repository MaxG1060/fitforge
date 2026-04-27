import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken, fetchPersonalInfo } from '@/lib/oura'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) redirect('/dashboard?oura=error')

  const tokens = await exchangeCodeForToken(code)
  let ouraUserId = null
  try {
    const info = await fetchPersonalInfo(tokens.access_token)
    ouraUserId = info.id ?? null
  } catch {}

  await supabase.from('oura_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    oura_user_id: ouraUserId,
    updated_at: new Date().toISOString(),
  })

  redirect('/dashboard?oura=connected')
}
