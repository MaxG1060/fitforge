import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: metrics } = await supabase
    .from('body_metrics')
    .select('weight_kg, body_fat_pct, muscle_mass_kg')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const statsLine = metrics
    ? `Weight: ${metrics.weight_kg ?? '?'}kg | Body fat: ${metrics.body_fat_pct ?? '?'}% | Muscle mass: ${metrics.muscle_mass_kg ?? '?'}kg`
    : 'No metrics logged yet'

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are an expert strength and conditioning coach. Generate practical weekly training plans. Format as clean markdown: use ## for each day (e.g. ## Monday — Upper Body), bullet points for exercises with sets × reps, and a brief coaching note per session. Goals: functional fitness + fat loss. Training style: gym-based, intermediate level. No preamble — start directly with Monday.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a weekly training plan (Mon–Sun) for an athlete with these stats: ${statsLine}. Include 4 training days and 3 rest/active recovery days. Blend strength training with conditioning. Add a weekly focus note at the end.`,
      },
    ],
  })

  const plan = response.content[0].text
  return Response.json({ plan })
}
