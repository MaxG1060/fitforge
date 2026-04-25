import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  getValidAccessToken,
  fetchRecentRecovery,
  fetchRecentSleep,
  fetchRecentCycles,
} from '@/lib/whoop'

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function dedupeByDate(rows) {
  const map = new Map()
  for (const row of rows) map.set(row.date, row)
  return [...map.values()]
}

export async function POST() {
  try {
    return await sync()
  } catch (e) {
    console.error('WHOOP sync failed:', e)
    return Response.json({ error: e.message ?? 'Sync failed' }, { status: 500 })
  }
}

async function sync() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const accessToken = await getValidAccessToken(supabase, user.id)
  if (!accessToken) return Response.json({ error: 'Connect WHOOP first' }, { status: 400 })

  const [recovery, sleep, cycles] = await Promise.all([
    fetchRecentRecovery(accessToken, 14),
    fetchRecentSleep(accessToken, 14),
    fetchRecentCycles(accessToken, 14),
  ])

  const recoveryRows = (recovery.records ?? [])
    .filter((r) => r.score?.recovery_score != null)
    .map((r) => ({
      user_id: user.id,
      date: isoDate(r.created_at),
      score: r.score.recovery_score,
      hrv_ms: r.score.hrv_rmssd_milli,
      resting_hr: r.score.resting_heart_rate,
      updated_at: new Date().toISOString(),
    }))

  const sleepRows = (sleep.records ?? [])
    .filter((s) => s.score)
    .map((s) => ({
      user_id: user.id,
      date: isoDate(s.end ?? s.created_at),
      duration_min: s.score?.stage_summary
        ? Math.round(
            (s.score.stage_summary.total_in_bed_time_milli ?? 0) / 60000
          )
        : null,
      performance_pct: s.score?.sleep_performance_percentage ?? null,
      efficiency_pct: s.score?.sleep_efficiency_percentage ?? null,
      updated_at: new Date().toISOString(),
    }))

  const cycleRows = (cycles.records ?? [])
    .filter((c) => c.score)
    .map((c) => ({
      user_id: user.id,
      date: isoDate(c.start),
      strain: c.score?.strain ?? null,
      avg_hr: c.score?.average_heart_rate ?? null,
      max_hr: c.score?.max_heart_rate ?? null,
      updated_at: new Date().toISOString(),
    }))

  const rec = dedupeByDate(recoveryRows)
  const slp = dedupeByDate(sleepRows)
  const cyc = dedupeByDate(cycleRows)

  if (rec.length) {
    const { error } = await supabase.from('whoop_recovery').upsert(rec)
    if (error) throw new Error(`Recovery insert failed: ${error.message}`)
  }
  if (slp.length) {
    const { error } = await supabase.from('whoop_sleep').upsert(slp)
    if (error) throw new Error(`Sleep insert failed: ${error.message}`)
  }
  if (cyc.length) {
    const { error } = await supabase.from('whoop_cycle').upsert(cyc)
    if (error) throw new Error(`Cycle insert failed: ${error.message}`)
  }

  revalidatePath('/dashboard')

  return Response.json({
    recovery: rec.length,
    sleep: slp.length,
    cycles: cyc.length,
  })
}
