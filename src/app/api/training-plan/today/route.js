import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getGoal } from '@/lib/goals'

function recoveryGuidance(score) {
  if (score == null) return 'Recovery unknown — keep the planned session as written.'
  if (score >= 67) return `WHOOP recovery is GREEN (${score}%). Athlete is ready — keep volume and intensity as planned, or push slightly. Do NOT dial back.`
  if (score >= 34) return `WHOOP recovery is YELLOW (${score}%). Keep the same sport but trim total volume by ~15-25%, hold intensity moderate, prioritize quality reps over fatigue. Add a clear "tuned for yellow recovery" coaching note.`
  return `WHOOP recovery is RED (${score}%). Keep the same sport but make this an active-recovery / deload session: ~50% normal volume, low intensity, technique focus only. Add a clear "tuned for red recovery — easy day" coaching note.`
}

export async function POST(request) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { dayTitle, sport, recoveryScore, otherDays } = await request.json()
  if (!dayTitle || !sport) return Response.json({ error: 'Missing dayTitle or sport' }, { status: 400 })

  const goal = getGoal(user.user_metadata?.goal)
  const guidance = recoveryGuidance(recoveryScore)

  const otherList = (otherDays ?? []).map((d, i) => `${i + 1}. ${d.title}`).join('\n') || 'none'

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: `You are a sports performance coach. Generate a single day's training session that is tuned to the athlete's WHOOP recovery score for today, but keeps the same sport. Format your response as clean markdown starting with the day name and session focus as a ## heading (e.g. "## Tuesday — Tempo Run"). Then list the warm-up, main work, and cool-down as bullets. Keep it concise and practical. Primary goal: ${goal.coachPrompt}.

CRITICAL: The sport for this day must NOT change. Only adjust volume, intensity, and structure based on recovery.

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
        content: `Tune today's training day "${dayTitle}" for the athlete's recovery. The sport for this day must remain: ${sport}.

${guidance}

Other days already in the plan (don't duplicate the focus):
${otherList}

Provide one ${sport} session in standard day-card format (## heading + bullets), tuned for today's recovery.`,
      },
    ],
  })

  const day = response.content[0].text.trim()
  return Response.json({ day })
}
