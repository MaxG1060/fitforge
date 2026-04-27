import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getGoal } from '@/lib/goals'

export async function POST(request) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { days } = await request.json()
  if (!Array.isArray(days) || days.length === 0) {
    return Response.json({ error: 'Missing days' }, { status: 400 })
  }

  const goal = getGoal(user.user_metadata?.goal)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('sport_type, moving_time_s')
    .eq('user_id', user.id)
    .gte('started_at', sevenDaysAgo)

  const sessionCount = (recentWorkouts ?? []).length
  const totalMinutes = (recentWorkouts ?? []).reduce((sum, w) => sum + (w.moving_time_s ?? 0) / 60, 0)
  const loadLine = sessionCount > 0
    ? `${sessionCount} sessions / ${Math.round(totalMinutes)} min in the last 7 days`
    : 'no recent training logged'

  const dayList = days.map((d, i) => `${i + 1}. ${d.title}`).join('\n')

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 256,
    system: `You are a sports performance coach. Write a 2-4 sentence "Weekly focus" paragraph for the athlete that references their recent training load and explains how this week's mix of sessions fits the goal. Plain prose, no heading, no bullets, no preamble. Primary goal: ${goal.coachPrompt}.`,
    messages: [
      {
        role: 'user',
        content: `Recent training load: ${loadLine}.

This week's sessions:
${dayList}

Write the Weekly focus paragraph.`,
      },
    ],
  })

  const focus = response.content[0].text.trim()
  return Response.json({ focus })
}
