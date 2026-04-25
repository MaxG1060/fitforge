import { createClient } from '@/lib/supabase/server'
import TrainingPlan from '@/components/TrainingPlan'

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: latest } = await supabase
    .from('plans')
    .select('content, created_at')
    .eq('user_id', user.id)
    .eq('kind', 'training')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">This Week</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">Training Plan</h2>
        <p className="mt-2 text-sm text-zinc-500">Generated weekly, tailored to your sport mix and recent activity.</p>
      </div>
      <TrainingPlan savedPlan={latest?.content} savedAt={latest?.created_at} />
    </>
  )
}
