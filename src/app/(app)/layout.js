import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import UserMenu from '@/components/UserMenu'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: stravaToken } = await supabase
    .from('strava_tokens')
    .select('profile_url')
    .eq('user_id', user.id)
    .maybeSingle()

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
        <UserMenu email={user.email} profileUrl={stravaToken?.profile_url} />
      </header>
      <NavBar />
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-10 space-y-6 flex-1">
        {children}
      </main>
    </div>
  )
}
