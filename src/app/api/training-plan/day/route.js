import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getGoal } from '@/lib/goals'

export async function POST(request) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { dayTitle, sport, otherDays } = await request.json()
  if (!dayTitle || !sport) return Response.json({ error: 'Missing dayTitle or sport' }, { status: 400 })

  const goal = getGoal(user.user_metadata?.goal)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('sport_type, distance_m, moving_time_s')
    .eq('user_id', user.id)
    .gte('started_at', sevenDaysAgo)

  const sessionCount = (recentWorkouts ?? []).length
  const totalMinutes = (recentWorkouts ?? []).reduce((sum, w) => sum + (w.moving_time_s ?? 0) / 60, 0)
  const loadLine = sessionCount > 0
    ? `${sessionCount} sessions / ${Math.round(totalMinutes)} min in the last 7 days`
    : 'no recent training logged'

  const otherList = (otherDays ?? []).map((d, i) => `${i + 1}. ${d.title}`).join('\n') || 'none'

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: `You are a sports performance coach. Generate a single day's training session as part of a weekly plan. Format your response as clean markdown starting with the day name and session focus as a ## heading (e.g. "## Tuesday — Tempo Run"). Then list the warm-up, main work, and cool-down as bullets. Keep it concise and practical. Primary goal: ${goal.coachPrompt}.

SPORT-SPECIFIC RULES:
- "Home workout" sessions MUST use only bodyweight exercises and resistance bands. No barbells, dumbbells, kettlebells, machines, benches, or pull-up bars. Typical moves: push-ups (and variations), squats, lunges, glute bridges, planks, banded rows, banded squats, banded RDLs, band pull-aparts, band overhead press, band curls, pike push-ups, etc.

EXERCISE BULLET FORMAT — every exercise bullet MUST follow this pattern, with " — " (space em-dash space) as the separator:
- {Exercise name}: {sets × reps or duration} — {one short form cue, max 12 words}

Example: "- Goblet squats: 4 × 10 — sit hips back, drive through midfoot, full depth."

Do NOT use the em-dash inside the exercise name itself. No preamble — start directly with the ## heading.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a replacement training day for "${dayTitle}". The sport for this day must be: ${sport}.

Recent training load: ${loadLine}.

Other days already in the plan (don't duplicate the focus or volume):
${otherList}

Provide one ${sport} session in standard day-card format (## heading + bullets).`,
      },
    ],
  })

  const day = response.content[0].text.trim()
  return Response.json({ day })
}
