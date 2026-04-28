import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import UserMenu from '@/components/UserMenu'
import SportIcon from '@/components/SportIcon'
import { computeStreak, isoDate } from '@/lib/week'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const [{ data: stravaToken }, { data: completions }] = await Promise.all([
    supabase
      .from('strava_tokens')
      .select('profile_url')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('workout_completions')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', isoDate(sixtyDaysAgo))
      .order('date', { ascending: false }),
  ])

  const streak = computeStreak((completions ?? []).map((r) => r.date))

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col flex-1"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <header className="border-b border-zinc-900 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black tracking-[0.2em] text-orange-500 shrink-0 uppercase">FitForge</h1>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-1 text-xs font-bold text-orange-400">
            <SportIcon type="fire" size={12} className="text-orange-400" />
            <span className="tabular-nums">{streak}</span>
          </span>
          <UserMenu email={user.email} profileUrl={stravaToken?.profile_url} />
        </div>
      </header>
      <NavBar />
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-10 space-y-6 flex-1">
        {children}
      </main>
    </div>
  )
}
