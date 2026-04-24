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

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are a sports nutrition expert. Generate Sunday meal prep plans with exactly 5 high-protein meals. Format your response as clean markdown with meal names as ## headings. For each meal include: ingredients list, brief prep instructions, and macros (calories, protein, carbs, fat). Keep instructions practical for batch cooking. No preamble — start directly with the first meal.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a Sunday meal prep plan for someone weighing ${weightKg}kg. Daily protein target: ${proteinTarget}g (2.5g/kg). Split across 5 meals. Focus on whole foods, high protein density, and easy batch cooking. Include total daily macros at the end.`,
      },
    ],
  })

  const plan = response.content[0].text
  return Response.json({ plan })
}
