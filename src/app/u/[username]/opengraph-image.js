import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeStreak, isoDate, weekStartMonday } from '@/lib/week'

export const alt = 'FitForge profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }) {
  const { username } = await params
  const u = username.toLowerCase()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, is_public')
    .eq('username', u)
    .eq('is_public', true)
    .maybeSingle()

  let streak = 0
  let weekCount = 0
  let avatarUrl = null
  let firstname = null
  if (profile) {
    const admin = createAdminClient()
    const [{ data: completions }, { data: stravaToken }] = await Promise.all([
      supabase
        .from('workout_completions')
        .select('date')
        .eq('user_id', profile.user_id)
        .gte('date', isoDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)))
        .order('date', { ascending: false }),
      admin
        .from('strava_tokens')
        .select('profile_url, firstname')
        .eq('user_id', profile.user_id)
        .maybeSingle(),
    ])
    const dates = (completions ?? []).map((r) => r.date)
    streak = computeStreak(dates)
    const mondayIso = isoDate(weekStartMonday())
    weekCount = dates.filter((d) => d >= mondayIso).length
    avatarUrl = stravaToken?.profile_url ?? null
    firstname = stravaToken?.firstname ?? null
  }

  const display = profile?.display_name?.trim() || firstname || profile?.username || username

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'black',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#f97316', fontSize: 28, fontWeight: 900, letterSpacing: '0.2em' }}>
            FITFORGE
          </div>
          <div style={{ color: '#71717a', fontSize: 22 }}>@{u}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 64 }}>
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={display}
              width={160}
              height={160}
              style={{
                width: 160,
                height: 160,
                borderRadius: 9999,
                objectFit: 'cover',
                border: '2px solid #27272a',
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#71717a', fontSize: 22, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              This week
            </div>
            <div style={{ fontSize: 96, fontWeight: 900, marginTop: 12 }}>{display}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 'auto' }}>
          <Stat label="Streak" value={`${streak}`} unit={streak === 1 ? 'day' : 'days'} />
          <Stat label="Sessions" value={`${weekCount}`} unit={weekCount === 1 ? 'this wk' : 'this wk'} />
          <Stat label="Built with" value="Claude" unit="AI coach" accent />
        </div>
      </div>
    ),
    { ...size }
  )
}

function Stat({ label, value, unit, accent }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        border: '1px solid #18181b',
        borderRadius: 16,
        padding: 32,
      }}
    >
      <div style={{ color: '#71717a', fontSize: 18, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 12 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: accent ? '#f97316' : 'white' }}>{value}</div>
        <div style={{ fontSize: 22, color: '#a1a1aa' }}>{unit}</div>
      </div>
    </div>
  )
}
