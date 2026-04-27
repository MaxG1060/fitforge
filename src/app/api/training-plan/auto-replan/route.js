import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getGoal } from '@/lib/goals'

function inferSportFromTitle(title) {
  if (!title) return null
  const t = title.toLowerCase()
  const map = [
    ['home workout', 'Home workout'],
    ['road cycling', 'Road cycling'],
    ['cycling', 'Road cycling'], ['bike', 'Road cycling'], ['ride', 'Road cycling'],
    ['running', 'Running'], ['run', 'Running'], ['tempo', 'Running'], ['sprint', 'Running'],
    ['swim', 'Swimming'],
    ['rowing', 'Rowing'], ['erg', 'Rowing'],
    ['hiking', 'Hiking'], ['hike', 'Hiking'],
    ['boxing', 'Boxing'],
    ['padel', 'Padel'],
    ['yoga', 'Yoga'],
    ['pilates', 'Pilates'],
    ['hiit', 'HIIT'], ['interval', 'HIIT'], ['circuit', 'HIIT'],
    ['gym', 'Gym'], ['strength', 'Gym'], ['lift', 'Gym'],
    ['upper body', 'Gym'], ['lower body', 'Gym'], ['full body', 'Gym'],
    ['push', 'Gym'], ['pull', 'Gym'], ['squat', 'Gym'], ['deadlift', 'Gym'], ['bench', 'Gym'],
  ]
  for (const [needle, sport] of map) if (t.includes(needle)) return sport
  return null
}

function extractSportsFromPlan(content) {
  if (!content) return []
  const sports = new Set()
  for (const line of content.split('\n')) {
    if (!line.startsWith('## ')) continue
    const title = line.slice(3).trim()
    if (/weekly\s*focus/i.test(title)) continue
    const sport = inferSportFromTitle(title)
    if (sport) sports.add(sport)
  }
  return [...sports]
}

function countDays(content) {
  if (!content) return 0
  let n = 0
  for (const line of content.split('\n')) {
    if (!line.startsWith('## ')) continue
    if (/weekly\s*focus/i.test(line)) continue
    n++
  }
  return n
}

export async function POST() {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const goal = getGoal(user.user_metadata?.goal)

  const { data: prevPlan } = await supabase
    .from('plans')
    .select('content')
    .eq('user_id', user.id)
    .eq('kind', 'training')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sports = extractSportsFromPlan(prevPlan?.content)
  const sportsToUse = sports.length > 0 ? sports : ['Gym', 'Running']
  const plannedDays = countDays(prevPlan?.content)

  const { data: metrics } = await supabase
    .from('body_metrics')
    .select('weight_kg, body_fat_pct, muscle_mass_kg')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('sport_type, distance_m, moving_time_s, started_at, average_heartrate')
    .eq('user_id', user.id)
    .gte('started_at', fourteenDaysAgo)
    .order('started_at', { ascending: false })

  const { data: completions } = await supabase
    .from('workout_completions')
    .select('date')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo)

  const { data: recovery } = await supabase
    .from('whoop_recovery')
    .select('score, date')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: false })

  const { data: sleep } = await supabase
    .from('whoop_sleep')
    .select('performance_pct, date')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: false })

  const { data: ouraReadiness } = await supabase
    .from('oura_readiness')
    .select('score, date')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: false })

  const { data: ouraSleep } = await supabase
    .from('oura_sleep')
    .select('score, date')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: false })

  const completedCount = (completions ?? []).length
  const completionRate =
    plannedDays > 0 ? Math.round((completedCount / plannedDays) * 100) : null

  const whoopRecoveryScores = (recovery ?? []).map((r) => r.score).filter((s) => s != null)
  const ouraReadinessScores = (ouraReadiness ?? []).map((r) => r.score).filter((s) => s != null)
  const recoveryScores = whoopRecoveryScores.length ? whoopRecoveryScores : ouraReadinessScores
  const recoverySource = whoopRecoveryScores.length ? 'WHOOP' : ouraReadinessScores.length ? 'Oura' : null
  const avgRecovery = recoveryScores.length
    ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length)
    : null
  const recoveryTrend = (() => {
    if (recoveryScores.length < 4) return null
    const half = Math.floor(recoveryScores.length / 2)
    const recent = recoveryScores.slice(0, half)
    const older = recoveryScores.slice(half)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    const diff = recentAvg - olderAvg
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  })()

  const whoopSleepScores = (sleep ?? []).map((s) => s.performance_pct).filter((s) => s != null)
  const ouraSleepScores = (ouraSleep ?? []).map((s) => s.score).filter((s) => s != null)
  const sleepScores = whoopSleepScores.length ? whoopSleepScores : ouraSleepScores
  const avgSleep = sleepScores.length
    ? Math.round(sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length)
    : null

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

  const completionLine = completionRate != null
    ? `Last week completion: ${completedCount}/${plannedDays} sessions (${completionRate}%).`
    : 'Last week completion: not tracked.'

  const recoveryLine = avgRecovery != null
    ? `${recoverySource} avg recovery (last 7d): ${avgRecovery}% — trend ${recoveryTrend ?? 'unknown'}.`
    : 'Recovery: not tracked.'

  const sleepLine = avgSleep != null
    ? `Avg sleep score (last 7d): ${avgSleep}%.`
    : 'Sleep: not tracked.'

  const adaptiveGuidance = (() => {
    const notes = []
    if (completionRate != null) {
      if (completionRate < 50) notes.push('Athlete completed under half of last week — reduce volume by ~25% and prioritize sustainability over intensity this week.')
      else if (completionRate >= 85) notes.push('Athlete completed almost everything last week — they have capacity to push slightly harder this week.')
    }
    if (recoveryTrend === 'declining' || (avgRecovery != null && avgRecovery < 50)) {
      notes.push('Recovery is trending down or low — bias toward shorter sessions, lower intensity, more active recovery.')
    }
    if (recoveryTrend === 'improving' && avgRecovery != null && avgRecovery >= 60) {
      notes.push('Recovery is improving and at a healthy level — good week to schedule one harder key session.')
    }
    if (avgSleep != null && avgSleep < 65) {
      notes.push('Sleep performance has been low — keep most sessions in zone 2 / submaximal range.')
    }
    return notes.length ? notes.join(' ') : 'No special adaptive guidance — keep load consistent with goal.'
  })()

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are an expert strength and conditioning coach generating an ADAPTIVE Monday auto-replan. Format as clean markdown. Start with a "## Weekly focus" heading containing 2-4 sentences that reference last week's completion, recovery trend, and how this week's plan responds. Then list each day Monday through Sunday as its own ## heading (e.g. "## Monday — Upper Body") with bullet points for exercises and a brief coaching note per session. Primary goal: ${goal.coachPrompt}.

This is a Monday auto-replan. Adapt the new week's volume, intensity, and structure to reflect ALL of: last week's completion rate, WHOOP recovery trend, sleep, and recent training load. Do NOT just rewrite the same week.

MANDATORY DURATION LINE — for EVERY day, the line directly after the "## " heading MUST be an italic duration estimate, on its own line, in this exact form:
_Duration: ~45 min_

Replace 45 with your estimate of total session length (including warm-up and cool-down). Use a single integer — not a range. Use the literal word "Duration:" before the number. Always wrap in single underscores. Do NOT skip this line on any day.

SPORT-SPECIFIC RULES:
- "Home workout" sessions MUST use only bodyweight exercises and resistance bands. No barbells, dumbbells, kettlebells, machines, benches, or pull-up bars.

EXERCISE BULLET FORMAT — every exercise bullet MUST follow this exact pattern, with " — " (space em-dash space) as the separator:
- {Exercise name}: {sets × reps or duration} — {one short form cue, max 12 words}

For pure cardio bullets without sets/reps, still include the dash and a cue. No preamble — start directly with "## Weekly focus".`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate this week's adaptive training plan (Mon–Sun) for an athlete with these stats: ${statsLine}.

Sports to include this week (carry over from last week's plan): ${sportsToUse.join(', ')}.

${completionLine}
${recoveryLine}
${sleepLine}

ADAPTIVE GUIDANCE: ${adaptiveGuidance}

Recent activity (last 14 days from Strava):
${workoutSummary}

Pick a sensible number of training days (typically 3–5) with appropriate rest/active recovery, accounting for the adaptive guidance above. Start the response with the "## Weekly focus" section that explicitly calls out what's different from last week and why, then list days Monday through Sunday.`,
      },
    ],
  })

  const plan = response.content[0].text
  await supabase.from('plans').insert({ user_id: user.id, kind: 'training', content: plan })

  return Response.json({
    plan,
    summary: {
      completedCount,
      plannedDays,
      completionRate,
      avgRecovery,
      recoveryTrend,
      avgSleep,
      sportsUsed: sportsToUse,
    },
  })
}
