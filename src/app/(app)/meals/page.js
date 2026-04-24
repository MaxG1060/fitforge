import { createClient } from '@/lib/supabase/server'
import MealPlan from '@/components/MealPlan'

export default async function MealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: latest } = await supabase
    .from('plans')
    .select('content, created_at')
    .eq('user_id', user.id)
    .eq('kind', 'meal')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold">Meal Plan</h2>
        <p className="mt-1 text-zinc-400">High-protein Sunday meal prep, calibrated to your training load.</p>
      </div>
      <MealPlan savedPlan={latest?.content} savedAt={latest?.created_at} />
    </>
  )
}
