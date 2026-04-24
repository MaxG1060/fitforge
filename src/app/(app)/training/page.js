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
        <h2 className="text-2xl font-semibold">Training Plan</h2>
        <p className="mt-1 text-zinc-400">Generated weekly, tailored to your sport mix and recent activity.</p>
      </div>
      <TrainingPlan savedPlan={latest?.content} savedAt={latest?.created_at} />
    </>
  )
}
