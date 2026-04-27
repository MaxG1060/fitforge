const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize'
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token'
const OURA_API = 'https://api.ouraring.com/v2/usercollection'

export const OURA_SCOPES = ['daily', 'personal'].join(' ')

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.OURA_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oura/callback`,
    scope: OURA_SCOPES,
    state,
  })
  return `${OURA_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oura/callback`,
    client_id: process.env.OURA_CLIENT_ID,
    client_secret: process.env.OURA_CLIENT_SECRET,
  })
  const res = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Oura token exchange failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.OURA_CLIENT_ID,
    client_secret: process.env.OURA_CLIENT_SECRET,
  })
  const res = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Oura token refresh failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function getValidAccessToken(supabase, userId) {
  const { data: tokens } = await supabase
    .from('oura_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokens) return null

  const now = Math.floor(Date.now() / 1000)
  if (tokens.expires_at > now + 60) return tokens.access_token

  const refreshed = await refreshAccessToken(tokens.refresh_token)
  await supabase
    .from('oura_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return refreshed.access_token
}

async function ouraGet(accessToken, path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${OURA_API}${path}${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Oura GET ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

function isoDaysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export async function fetchRecentReadiness(accessToken, days = 14) {
  return ouraGet(accessToken, '/daily_readiness', {
    start_date: isoDaysAgo(days),
    end_date: isoDaysAgo(0),
  })
}

export async function fetchRecentSleep(accessToken, days = 14) {
  return ouraGet(accessToken, '/daily_sleep', {
    start_date: isoDaysAgo(days),
    end_date: isoDaysAgo(0),
  })
}

export async function fetchPersonalInfo(accessToken) {
  return ouraGet(accessToken, '/personal_info')
}
