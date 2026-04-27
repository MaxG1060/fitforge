export const GOALS = [
  {
    id: 'general',
    label: 'General fitness',
    desc: 'Balanced strength, mobility, and conditioning for overall health.',
    coachPrompt: 'general fitness — balanced functional strength, mobility, and aerobic conditioning',
  },
  {
    id: 'muscle',
    label: 'Gain muscle',
    desc: 'Hypertrophy-focused strength training with adequate recovery.',
    coachPrompt: 'muscle gain — hypertrophy-focused training, compound lifts, progressive overload, sufficient volume per muscle group',
  },
  {
    id: 'weight',
    label: 'Lose weight',
    desc: 'Calorie burn through mixed cardio and resistance training.',
    coachPrompt: 'fat loss — mix of moderate-intensity cardio, HIIT, and resistance training to preserve muscle while in a deficit',
  },
  {
    id: 'endurance',
    label: 'Improve endurance',
    desc: 'Aerobic capacity, stamina, and longer sessions.',
    coachPrompt: 'endurance — zone 2 aerobic base, tempo work, longer sessions, supportive strength training to prevent injury',
  },
]

export const DEFAULT_GOAL_ID = 'general'

export function getGoal(id) {
  return GOALS.find((g) => g.id === id) ?? GOALS.find((g) => g.id === DEFAULT_GOAL_ID)
}
