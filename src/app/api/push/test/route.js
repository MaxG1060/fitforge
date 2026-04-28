import { createClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'
import { findTodaySession } from '@/lib/todayPlan'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return Response.json({ error: 'No push subscriptions found.' }, { status: 400 })
  }

  const { data: latest } = await supabase
    .from('plans')
    .select('content')
    .eq('user_id', user.id)
    .eq('kind', 'training')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const today = findTodaySession(latest?.content)
  const body = today
    ? `${today.title}${today.duration ? ` · ~${today.duration} min` : ''}`
    : 'Open FitForge to plan your day.'

  let sent = 0
  const stale = []
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendPush(s, { title: 'FitForge — today', body, url: '/training' })
        sent++
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) stale.push(s.endpoint)
      }
    })
  )

  if (stale.length) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .in('endpoint', stale)
  }

  return Response.json({ sent, removed: stale.length })
}
