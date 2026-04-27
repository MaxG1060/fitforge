'use server'

import { createClient } from '@/lib/supabase/server'
import { GOALS } from '@/lib/goals'
import { MEAL_GOALS, DIETARY_RESTRICTIONS } from '@/lib/diet'
import { revalidatePath } from 'next/cache'

export async function setGoal(goalId) {
  const supabase = await createClient()
  const valid = GOALS.some((g) => g.id === goalId)
  if (!valid) return { error: 'Invalid goal' }
  const { error } = await supabase.auth.updateUser({ data: { goal: goalId } })
  if (error) return { error: error.message }
  revalidatePath('/training')
  revalidatePath('/settings')
  return { ok: true }
}

export async function setMealSettings({ mealGoal, restrictions }) {
  const supabase = await createClient()
  if (mealGoal && !MEAL_GOALS.some((g) => g.id === mealGoal)) {
    return { error: 'Invalid meal goal' }
  }
  const cleanRestrictions = Array.isArray(restrictions)
    ? restrictions.filter((id) => DIETARY_RESTRICTIONS.some((r) => r.id === id))
    : []
  const { error } = await supabase.auth.updateUser({
    data: { meal_goal: mealGoal, dietary_restrictions: cleanRestrictions },
  })
  if (error) return { error: error.message }
  revalidatePath('/meals')
  revalidatePath('/settings')
  return { ok: true }
}

export async function completeOnboarding() {
  const supabase = await createClient()
  await supabase.auth.updateUser({
    data: { onboarded_at: new Date().toISOString() },
  })
}

export async function logStartingWeight(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const weight = parseFloat(formData.get('weight'))
  if (!weight || weight < 30 || weight > 400) return { error: 'Enter a valid weight' }

  const { error } = await supabase.from('body_metrics').insert({
    user_id: user.id,
    weight_kg: weight,
    recorded_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }

  return { ok: true }
}
