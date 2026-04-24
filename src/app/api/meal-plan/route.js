import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: metrics } = await supabase
    .from('body_metrics')
    .select('weight_kg')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const weightKg = metrics?.weight_kg ?? 80
  const proteinTarget = Math.round(weightKg * 2.5)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('sport_type, distance_m, moving_time_s')
    .eq('user_id', user.id)
    .gte('started_at', sevenDaysAgo)

  const totalMinutes = (recentWorkouts ?? []).reduce((sum, w) => sum + (w.moving_time_s ?? 0) / 60, 0)
  const sessionCount = (recentWorkouts ?? []).length
  const sportBreakdown = (recentWorkouts ?? []).reduce((acc, w) => {
    const t = w.sport_type ?? 'Other'
    acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})
  const sportLine = Object.entries(sportBreakdown).map(([t, n]) => `${n}× ${t}`).join(', ') || 'none'

  const trainingLoadLine = sessionCount > 0
    ? `${sessionCount} sessions / ${Math.round(totalMinutes)} min total (${sportLine})`
    : 'No training sessions logged in the last 7 days'

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are a sports nutrition expert. Generate Sunday meal prep plans with exactly 5 high-protein meals, calibrated to the athlete's recent training load. Format your response as clean markdown with meal names as ## headings. For each meal include: ingredients list, brief prep instructions, and macros (calories, protein, carbs, fat). Scale total daily calories with training volume — high-volume weeks need more carbs and total energy; low-volume weeks lean leaner. Keep instructions practical for batch cooking. No preamble — start directly with the first meal.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a Sunday meal prep plan for someone weighing ${weightKg}kg. Daily protein target: ${proteinTarget}g (2.5g/kg). Split across 5 meals.

Last 7 days of training: ${trainingLoadLine}.

Calibrate carb and total calorie targets to this load. Focus on whole foods, high protein density, and easy batch cooking. End with total daily macros and a one-line note explaining how the calorie target reflects the training load.`,
      },
    ],
  })

  const plan = response.content[0].text
  await supabase.from('plans').insert({ user_id: user.id, kind: 'meal', content: plan })
  return Response.json({ plan })
}
