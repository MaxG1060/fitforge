import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getValidAccessToken,
  fetchRecoveryByCycleId,
  fetchSleepById,
  fetchCycleById,
} from '@/lib/whoop'

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function verifySignature(timestamp, body, signatureHeader) {
  if (!timestamp || !signatureHeader) return false
  const expected = crypto
    .createHmac('sha256', process.env.WHOOP_CLIENT_SECRET)
    .update(timestamp + body)
    .digest('base64')
  return expected === signatureHeader
}

export async function POST(request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-whoop-signature')
  const timestamp = request.headers.get('x-whoop-signature-timestamp')

  if (!verifySignature(timestamp, rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  handleEvent(event).catch((err) => console.error('WHOOP webhook failed:', err))
  return Response.json({ ok: true })
}

async function handleEvent(event) {
  const { user_id: whoopUserId, id: entityId, type } = event
  const supabase = createAdminClient()

  const { data: tokenRow } = await supabase
    .from('whoop_tokens')
    .select('user_id')
    .eq('whoop_user_id', whoopUserId)
    .maybeSingle()
  if (!tokenRow) return

  const userId = tokenRow.user_id
  const accessToken = await getValidAccessToken(supabase, userId)
  if (!accessToken) return

  if (type.startsWith('recovery.')) {
    const r = await fetchRecoveryByCycleId(accessToken, entityId)
    if (!r?.score?.recovery_score) return
    await supabase.from('whoop_recovery').upsert({
      user_id: userId,
      date: isoDate(r.created_at),
      score: r.score.recovery_score,
      hrv_ms: r.score.hrv_rmssd_milli,
      resting_hr: r.score.resting_heart_rate,
      updated_at: new Date().toISOString(),
    })
  } else if (type.startsWith('sleep.')) {
    const s = await fetchSleepById(accessToken, entityId)
    if (!s?.score) return
    await supabase.from('whoop_sleep').upsert({
      user_id: userId,
      date: isoDate(s.end ?? s.created_at),
      duration_min: s.score?.stage_summary
        ? Math.round((s.score.stage_summary.total_in_bed_time_milli ?? 0) / 60000)
        : null,
      performance_pct: s.score?.sleep_performance_percentage ?? null,
      efficiency_pct: s.score?.sleep_efficiency_percentage ?? null,
      updated_at: new Date().toISOString(),
    })
  } else if (type.startsWith('cycle.') || type.startsWith('workout.')) {
    const c = await fetchCycleById(accessToken, entityId).catch(() => null)
    if (!c?.score) return
    await supabase.from('whoop_cycle').upsert({
      user_id: userId,
      date: isoDate(c.start),
      strain: c.score?.strain ?? null,
      avg_hr: c.score?.average_heart_rate ?? null,
      max_hr: c.score?.max_heart_rate ?? null,
      updated_at: new Date().toISOString(),
    })
  }
}
