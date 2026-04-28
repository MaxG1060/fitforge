import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { findTodaySession } from '@/lib/todayPlan'

export async function GET(request) {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: subs, error: subsErr } = await admin
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
  if (subsErr) return Response.json({ error: subsErr.message }, { status: 500 })
  if (!subs || subs.length === 0) return Response.json({ sent: 0, users: 0 })

  const userIds = [...new Set(subs.map((s) => s.user_id))]

  // Latest training plan per user
  const { data: plans } = await admin
    .from('plans')
    .select('user_id, content, created_at')
    .in('user_id', userIds)
    .eq('kind', 'training')
    .order('created_at', { ascending: false })

  const latestByUser = new Map()
  for (const p of plans ?? []) {
    if (!latestByUser.has(p.user_id)) latestByUser.set(p.user_id, p.content)
  }

  let sent = 0
  let skipped = 0
  const stale = []

  await Promise.all(
    subs.map(async (s) => {
      const content = latestByUser.get(s.user_id)
      const today = findTodaySession(content)
      if (!today) {
        skipped++
        return
      }
      const body = `${today.title}${today.duration ? ` · ~${today.duration} min` : ''}`
      try {
        await sendPush(s, { title: 'FitForge — today', body, url: '/training' })
        sent++
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          stale.push({ user_id: s.user_id, endpoint: s.endpoint })
        }
      }
    })
  )

  for (const s of stale) {
    await admin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', s.user_id)
      .eq('endpoint', s.endpoint)
  }

  return Response.json({ sent, skipped, removed: stale.length, users: userIds.length })
}
