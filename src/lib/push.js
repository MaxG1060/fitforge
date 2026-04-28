import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

let configured = false
function ensureConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@fitforge.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  configured = true
}

export async function sendPush(subscription, payload) {
  ensureConfigured()
  const sub = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  }
  return webpush.sendNotification(sub, JSON.stringify(payload))
}

// Fetch a user's subscriptions via admin client and fan out a push.
// Cleans up stale (404/410) subscriptions silently.
export async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PRIVATE_KEY) return { sent: 0 }
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return { sent: 0 }

  let sent = 0
  const stale = []
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendPush(s, payload)
        sent++
      } catch (e) {
        if (e?.statusCode === 404 || e?.statusCode === 410) stale.push(s.endpoint)
      }
    })
  )
  if (stale.length) {
    await admin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .in('endpoint', stale)
  }
  return { sent, removed: stale.length }
}
