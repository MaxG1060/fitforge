export const MEAL_GOALS = [
  {
    id: 'lose',
    label: 'Lose weight',
    desc: 'Calorie deficit with protein-forward meals to preserve muscle.',
    coachPrompt: 'fat loss — moderate calorie deficit (~15-20% below maintenance), protein-forward, fiber-rich, stable blood sugar',
  },
  {
    id: 'maintain',
    label: 'Stay fit',
    desc: 'Maintenance calories balanced for performance and recovery.',
    coachPrompt: 'maintenance — calories balanced to training load, balanced macros for performance and recovery',
  },
  {
    id: 'gain',
    label: 'Gain weight',
    desc: 'Surplus calories to support muscle growth and recovery.',
    coachPrompt: 'lean bulk — moderate calorie surplus (~10-15% above maintenance), high protein, ample carbs around training',
  },
]

export const DEFAULT_MEAL_GOAL_ID = 'maintain'

export function getMealGoal(id) {
  return MEAL_GOALS.find((g) => g.id === id) ?? MEAL_GOALS.find((g) => g.id === DEFAULT_MEAL_GOAL_ID)
}

export const DIETARY_RESTRICTIONS = [
  { id: 'high_protein', label: 'High protein', coachPrompt: 'extra-high protein density (>2.5g/kg/day)' },
  { id: 'low_carb', label: 'Low carb', coachPrompt: 'low carb (<100g/day), prioritize fats and protein' },
  { id: 'vegetarian', label: 'Vegetarian', coachPrompt: 'vegetarian (no meat, no fish; eggs and dairy ok)' },
  { id: 'vegan', label: 'Vegan', coachPrompt: 'vegan (no animal products at all)' },
  { id: 'gluten_free', label: 'Gluten free', coachPrompt: 'gluten free (no wheat, barley, rye)' },
]

export function getRestrictions(ids) {
  if (!Array.isArray(ids)) return []
  return DIETARY_RESTRICTIONS.filter((r) => ids.includes(r.id))
}

export function buildDietPrompt(mealGoalId, restrictionIds) {
  const goal = getMealGoal(mealGoalId)
  const restrictions = getRestrictions(restrictionIds)
  const parts = [`Primary goal: ${goal.coachPrompt}.`]
  if (restrictions.length > 0) {
    parts.push(`Dietary requirements (must satisfy all): ${restrictions.map((r) => r.coachPrompt).join('; ')}.`)
  }
  return parts.join(' ')
}
