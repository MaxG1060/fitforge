import { redirect } from 'next/navigation'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state: 'login',
  })
  redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
