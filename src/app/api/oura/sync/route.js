import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  getValidAccessToken,
  fetchRecentReadiness,
  fetchRecentSleep,
} from '@/lib/oura'

function dedupeByDate(rows) {
  const map = new Map()
  for (const row of rows) map.set(row.date, row)
  return [...map.values()]
}

export async function POST() {
  try {
    return await sync()
  } catch (e) {
    console.error('Oura sync failed:', e)
    return Response.json({ error: e.message ?? 'Sync failed' }, { status: 500 })
  }
}

async function sync() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const accessToken = await getValidAccessToken(supabase, user.id)
  if (!accessToken) return Response.json({ error: 'Connect Oura first' }, { status: 400 })

  const [readiness, sleep] = await Promise.all([
    fetchRecentReadiness(accessToken, 14),
    fetchRecentSleep(accessToken, 14),
  ])

  const readinessRows = (readiness.data ?? [])
    .filter((r) => r.score != null)
    .map((r) => ({
      user_id: user.id,
      date: r.day,
      score: r.score,
      temperature_deviation: r.temperature_deviation ?? null,
      hrv_balance: r.contributors?.hrv_balance ?? null,
      resting_hr: r.contributors?.resting_heart_rate ?? null,
      updated_at: new Date().toISOString(),
    }))

  const sleepRows = (sleep.data ?? [])
    .filter((s) => s.score != null)
    .map((s) => ({
      user_id: user.id,
      date: s.day,
      score: s.score,
      total_sleep_min: s.contributors?.total_sleep ?? null,
      efficiency: s.contributors?.efficiency ?? null,
      updated_at: new Date().toISOString(),
    }))

  const rd = dedupeByDate(readinessRows)
  const sl = dedupeByDate(sleepRows)

  if (rd.length) {
    const { error } = await supabase.from('oura_readiness').upsert(rd)
    if (error) throw new Error(`Readiness insert failed: ${error.message}`)
  }
  if (sl.length) {
    const { error } = await supabase.from('oura_sleep').upsert(sl)
    if (error) throw new Error(`Sleep insert failed: ${error.message}`)
  }

  revalidatePath('/dashboard')
  revalidatePath('/training')

  return Response.json({ readiness: rd.length, sleep: sl.length })
}
