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
        text: `You are an expert strength and conditioning coach. Generate practical weekly training plans tailored to the athlete's recent training load. Format as clean markdown: use ## for each day (e.g. ## Monday — Upper Body), bullet points for exercises with sets × reps, and a brief coaching note per session. Goals: functional fitness + fat loss. Training style: gym-based, intermediate level. Account for recovery: if the athlete just did a high-volume week, dial back; if they took rest days, push harder. Reference their recent activity in the weekly focus note. No preamble — start directly with Monday.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a weekly training plan (Mon–Sun) for an athlete with these stats: ${statsLine}.

Recent activity (last 14 days from Strava):
${workoutSummary}

Include 4 training days and 3 rest/active recovery days. Blend strength training with conditioning. End with a "Weekly focus" note that briefly references the recent training load.`,
      },
    ],
  })

  const plan = response.content[0].text
  return Response.json({ plan })
}
