const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'
const WHOOP_API = 'https://api.prod.whoop.com/developer'

export const WHOOP_SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:workout',
  'read:profile',
  'read:body_measurement',
  'offline',
].join(' ')

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`,
    scope: WHOOP_SCOPES,
    state,
  })
  return `${WHOOP_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
  })
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`WHOOP token exchange failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
    scope: WHOOP_SCOPES,
  })
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`WHOOP token refresh failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function getValidAccessToken(supabase, userId) {
  const { data: tokens } = await supabase
    .from('whoop_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokens) return null

  const now = Math.floor(Date.now() / 1000)
  if (tokens.expires_at > now + 60) return tokens.access_token

  const refreshed = await refreshAccessToken(tokens.refresh_token)
  await supabase
    .from('whoop_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return refreshed.access_token
}

async function whoopGet(accessToken, path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${WHOOP_API}${path}${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`WHOOP GET ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function fetchProfile(accessToken) {
  return whoopGet(accessToken, '/v1/user/profile/basic')
}

export async function fetchRecentRecovery(accessToken, limit = 14) {
  return whoopGet(accessToken, '/v1/recovery', { limit })
}

export async function fetchRecentSleep(accessToken, limit = 14) {
  return whoopGet(accessToken, '/v1/activity/sleep', { limit })
}

export async function fetchRecentCycles(accessToken, limit = 14) {
  return whoopGet(accessToken, '/v1/cycle', { limit })
}

export async function fetchRecoveryByCycleId(accessToken, cycleId) {
  return whoopGet(accessToken, `/v1/cycle/${cycleId}/recovery`)
}

export async function fetchSleepById(accessToken, sleepId) {
  return whoopGet(accessToken, `/v1/activity/sleep/${sleepId}`)
}

export async function fetchCycleById(accessToken, cycleId) {
  return whoopGet(accessToken, `/v1/cycle/${cycleId}`)
}
