import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getGoal } from '@/lib/goals'

export async function POST(request) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  let sports = []
  try {
    const body = await request.json()
    if (Array.isArray(body?.sports)) sports = body.sports.filter((s) => typeof s === 'string')
  } catch {}
  if (sports.length === 0) sports = ['Gym', 'Running']

  const goal = getGoal(user.user_metadata?.goal)

  const { data: metrics } = await supabase
    .from('body_metrics')
    .select('weight_kg, body_fat_pct, muscle_mass_kg')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('name, sport_type, distance_m, moving_time_s, total_elevation_gain_m, started_at, average_heartrate')
    .eq('user_id', user.id)
    .gte('started_at', fourteenDaysAgo)
    .order('started_at', { ascending: false })

  const statsLine = metrics
    ? `Weight: ${metrics.weight_kg ?? '?'}kg | Body fat: ${metrics.body_fat_pct ?? '?'}% | Muscle mass: ${metrics.muscle_mass_kg ?? '?'}kg`
    : 'No metrics logged yet'

  const workoutSummary = (recentWorkouts ?? []).length > 0
    ? (recentWorkouts ?? []).map((w) => {
        const date = new Date(w.started_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        const km = w.distance_m ? `${(w.distance_m / 1000).toFixed(1)}km` : ''
        const min = w.moving_time_s ? `${Math.round(w.moving_time_s / 60)}min` : ''
        const hr = w.average_heartrate ? `avg HR ${Math.round(w.average_heartrate)}` : ''
        return `- ${date}: ${w.sport_type} ${[km, min, hr].filter(Boolean).join(' / ')}`.trim()
      }).join('\n')
    : 'No recent workouts logged.'

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are an expert strength and conditioning coach. Generate practical weekly training plans tailored to the athlete's recent training load and chosen sports. Format as clean markdown. Start with a "## Weekly focus" heading containing 2-4 sentences that reference the athlete's recent activity and explain how this week's sport mix fits. Then list each day Monday through Sunday as its own ## heading (e.g. "## Monday — Upper Body") with bullet points for exercises and a brief coaching note per session. Primary goal: ${goal.coachPrompt}. Use only the sports the athlete selects — distribute them sensibly across the week, balancing intensity, recovery, and complementary muscle groups in service of the goal. Account for recovery: if the athlete just did a high-volume week, dial back; if they took rest days, push harder.

MANDATORY DURATION LINE — for EVERY day, the line directly after the "## " heading MUST be an italic duration estimate, on its own line, in this exact form:
_Duration: ~45 min_

Replace 45 with your estimate of total session length (including warm-up and cool-down). Use a single integer — not a range. Use the literal word "Duration:" before the number. Always wrap in single underscores. Do NOT skip this line on any day, including rest days (use _Duration: ~20 min_ for active recovery, or _Duration: 0 min_ for full rest). This line MUST appear on every day before any bullet or other content.

SPORT-SPECIFIC RULES:
- "Home workout" sessions MUST use only bodyweight exercises and resistance bands. No barbells, dumbbells, kettlebells, machines, benches, or pull-up bars. Typical moves: push-ups (and variations), squats, lunges, glute bridges, planks, banded rows, banded squats, banded RDLs, band pull-aparts, band overhead press, band curls, pike push-ups, etc.

EXERCISE BULLET FORMAT — every exercise bullet MUST follow this exact pattern, with " — " (space em-dash space) as the separator:
- {Exercise name}: {sets × reps or duration} — {one short form cue, max 12 words}

Example: "- Goblet squats: 4 × 10 — sit hips back, drive through midfoot, full depth."

The cue should be a single useful pointer (technique, tempo, or focus). Do NOT use the em-dash inside the exercise name itself. For pure cardio bullets without sets/reps, still include the dash and a cue (e.g. "- Easy run: 30 min — conversational pace, nasal breathing"). No preamble — start directly with "## Weekly focus".`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a weekly training plan (Mon–Sun) for an athlete with these stats: ${statsLine}.

Sports to include this week: ${sports.join(', ')}. Build the plan around these only.

Recent activity (last 14 days from Strava):
${workoutSummary}

Pick a sensible number of training days (typically 3–5) with appropriate rest/active recovery. Start the response with the "## Weekly focus" section, then list days Monday through Sunday.`,
      },
    ],
  })

  const plan = response.content[0].text
  await supabase.from('plans').insert({ user_id: user.id, kind: 'training', content: plan })
  return Response.json({ plan })
}
