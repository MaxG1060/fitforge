import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col flex-1">
      <header className="border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-orange-500 shrink-0">FitForge</h1>
        <span className="text-xs sm:text-sm text-zinc-400 truncate min-w-0">{user.email}</span>
      </header>
      <NavBar />
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 flex-1">
        {children}
      </main>
    </div>
  )
}
