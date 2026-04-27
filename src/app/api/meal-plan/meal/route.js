import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildDietPrompt } from '@/lib/diet'

export async function POST(request) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { mealTitle, otherMeals, hint } = await request.json()
  if (!mealTitle) return Response.json({ error: 'Missing mealTitle' }, { status: 400 })

  const { data: metrics } = await supabase
    .from('body_metrics')
    .select('weight_kg')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const weightKg = metrics?.weight_kg ?? 80
  const proteinTarget = Math.round(weightKg * 2.5)
  const dietPrompt = buildDietPrompt(
    user.user_metadata?.meal_goal,
    user.user_metadata?.dietary_restrictions,
  )

  const otherMealsList = (otherMeals ?? []).map((m, i) => `${i + 1}. ${m.title}`).join('\n') || 'none'

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 768,
    system: [
      {
        type: 'text',
        text: `You are a sports nutrition expert. Generate a single meal as part of a 5-meal Sunday prep plan. ${dietPrompt} Format your response as clean markdown starting with the meal name as a ## heading. Include: ingredients list, brief prep instructions, and macros (calories, protein, carbs, fat). The meal must be different from the others in the plan and avoid the same primary protein source where possible. Honor every dietary requirement strictly. No preamble — start directly with the ## heading.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a replacement meal for someone weighing ${weightKg}kg (daily protein target ${proteinTarget}g across 5 meals).

The meal being replaced was: "${mealTitle}".

Other meals already in the plan (do not duplicate these or their main protein sources):
${otherMealsList}

${hint ? `User preference for this meal: ${hint}\n\n` : ''}Provide one new meal in the same format as a typical meal-prep entry.`,
      },
    ],
  })

  const meal = response.content[0].text.trim()
  return Response.json({ meal })
}
