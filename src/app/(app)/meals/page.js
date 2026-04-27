import { createClient } from '@/lib/supabase/server'
import MealPlan from '@/components/MealPlan'
import MealSettingsBadge from '@/components/MealSettingsBadge'
import { getMealGoal, getRestrictions, DEFAULT_MEAL_GOAL_ID } from '@/lib/diet'

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

  const mealGoalId = user.user_metadata?.meal_goal ?? DEFAULT_MEAL_GOAL_ID
  const restrictionIds = user.user_metadata?.dietary_restrictions ?? []
  const mealGoal = getMealGoal(mealGoalId)
  const restrictions = getRestrictions(restrictionIds)
  const summary = [mealGoal.label, ...restrictions.map((r) => r.label)].join(' · ')

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Sunday Prep</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Meal Plan</h2>
          <p className="mt-2 text-sm text-zinc-500">High-protein meal prep, calibrated to your training load.</p>
        </div>
        <MealSettingsBadge initialMealGoal={mealGoalId} initialRestrictions={restrictionIds} />
      </div>
      <MealPlan savedPlan={latest?.content} savedAt={latest?.created_at} dietSummary={summary} />
    </>
  )
}
