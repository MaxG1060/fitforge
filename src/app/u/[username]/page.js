import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GOALS } from '@/lib/goals'
import { computeStreak, isoDate, weekStartMonday } from '@/lib/week'

export async function generateMetadata({ params }) {
  const { username } = await params
  const display = username
  return {
    title: `${display} on FitForge`,
    description: `Training plan, streak, and weekly volume for ${display}.`,
    openGraph: {
      title: `${display} on FitForge`,
      description: `Training plan, streak, and weekly volume for ${display}.`,
    },
  }
}

function parsePlanDays(content) {
  if (!content) return { focus: null, days: [] }
  const sections = content.split(/^## /m).filter(Boolean)
  let focus = null
  const days = []
  for (const sec of sections) {
    const [titleLine, ...rest] = sec.split('\n')
    const title = titleLine.trim()
    const body = rest.join('\n').trim()
    if (/weekly\s*focus/i.test(title)) focus = body
    else days.push({ title, body })
  }
  return { focus, days }
}

function getGoalLabel(metaGoalId) {
  return GOALS.find((g) => g.id === metaGoalId)?.label ?? 'General fitness'
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params
  const u = username.toLowerCase()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, is_public')
    .eq('username', u)
    .eq('is_public', true)
    .maybeSingle()

  if (!profile) notFound()

  const admin = createAdminClient()
  const [{ data: stravaToken }, { data: authUser }] = await Promise.all([
    admin
      .from('strava_tokens')
      .select('profile_url, firstname')
      .eq('user_id', profile.user_id)
      .maybeSingle(),
    admin.auth.admin.getUserById(profile.user_id),
  ])
  const avatarUrl = stravaToken?.profile_url ?? null
  const goalLabel = GOALS.find((g) => g.id === authUser?.user?.user_metadata?.goal)?.label ?? 'General fitness'

  const [{ data: latest }, { data: completions }] = await Promise.all([
    supabase
      .from('plans')
      .select('content, created_at')
      .eq('user_id', profile.user_id)
      .eq('kind', 'training')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workout_completions')
      .select('date')
      .eq('user_id', profile.user_id)
      .gte('date', isoDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)))
      .order('date', { ascending: false }),
  ])

  const completionDates = (completions ?? []).map((r) => r.date)
  const streak = computeStreak(completionDates)

  const monday = weekStartMonday()
  const mondayIso = isoDate(monday)
  const weekCount = completionDates.filter((d) => d >= mondayIso).length

  const { days } = parsePlanDays(latest?.content)
  const displayName = profile.display_name?.trim() || stravaToken?.firstname || profile.username

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-900 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="text-lg font-black tracking-[0.2em] text-orange-500 uppercase">
          FitForge
        </Link>
        <Link
          href="/login"
          className="rounded-md bg-orange-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors"
        >
          Join
        </Link>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-20 w-20 rounded-full border border-zinc-800 object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-2xl font-black text-zinc-500">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Public profile</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight truncate">{displayName}</h2>
            <p className="mt-1 text-sm text-zinc-500">@{profile.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Streak" value={streak} unit={streak === 1 ? 'day' : 'days'} />
          <Stat label="This week" value={weekCount} unit={weekCount === 1 ? 'session' : 'sessions'} />
          <Stat label="Goal" value={goalLabel} />
        </div>

        {days.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">This week</p>
            <ul className="space-y-2">
              {days.map((d, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-900 bg-zinc-950 px-5 py-4 text-base font-bold text-white"
                >
                  {d.title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-500">No training plan published yet.</p>
          </div>
        )}

        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 text-center">
          <p className="text-sm text-zinc-300">Build your own AI-personalized training plan.</p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 transition-colors"
          >
            Try FitForge
          </Link>
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value, unit }) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-5">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-zinc-500">{unit}</span>}
      </p>
    </div>
  )
}

